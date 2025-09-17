import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesModuleService } from './templates-module.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TemplatesComponent } from './entities/templates-module.entity';
import { MongoRepository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// Utilidad para crear un mock del repositorio
const mockRepo = () => ({
  findOneBy: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

type MockRepo<T = any> = Partial<Record<keyof MongoRepository<T>, jest.Mock>> & {
  findOneBy: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  remove: jest.Mock;
};

describe('TemplatesModuleService', () => {
  let service: TemplatesModuleService;
  let repository: MockRepo<TemplatesComponent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesModuleService,
        { provide: getRepositoryToken(TemplatesComponent), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<TemplatesModuleService>(TemplatesModuleService);
    repository = module.get(getRepositoryToken(TemplatesComponent));
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea un template nuevo si no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockImplementation((v) => Promise.resolve({ _id: '1', ...v }));
      const dto: any = { slug: 'hero', content: { type: 'A', props: { id: '1', title: 't', description: 'd' } }, root: { props: { title: 'root' } }, zones: {} };
      const res = await service.create(dto);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'hero' }));
      expect(res.slug).toBe('hero');
    });

    it('actualiza si ya existe con mismo slug', async () => {
      const existing: any = { slug: 'hero', content: {}, root: {}, zones: {} };
      repository.findOneBy.mockResolvedValue(existing);
      jest.spyOn(service, 'update').mockResolvedValue({ ...existing, content: { changed: true } });
      const dto: any = { slug: 'hero', content: { type: 'A', props: { id: '1', title: 't', description: 'd' } }, root: { props: { title: 'root' } }, zones: {} };
      const res = await service.create(dto);
      expect(service.update).toHaveBeenCalled();
      expect(res.content).toBe(true);
    });
  });

  describe('findAll', () => {
    it('retorna lista paginada', async () => {
      repository.find.mockResolvedValue([{ slug: 'a' }, { slug: 'b' }] as any);
      const res = await service.findAll({ limit: 2, offset: 0 });
      expect(res).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({ take: 2, skip: 0 });
    });
  });

  describe('findOne', () => {
    it('retorna el template', async () => {
      repository.findOneBy.mockResolvedValue({ slug: 'x' });
      const res = await service.findOne('x');
      expect(res.slug).toBe('x');
    });

    it('lanza NotFoundException si no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza un template existente', async () => {
      const existing: any = { slug: 'hero', content: { type: 'A', props: { id: '1', title: 't', description: 'd' } }, root: { props: { title: 'root' } }, zones: {} };
      jest.spyOn(service, 'findOne').mockResolvedValue(existing);
      repository.save.mockImplementation((v) => Promise.resolve(v));
      const res = await service.update('hero', { content: { type: 'B', props: { id: '1', title: 'nuevo', description: 'desc' } } } as any);
      expect(res.content.type).toBe('B');
      expect(res.content.props.title).toBe('nuevo');
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina un template existente', async () => {
      const existing: any = { slug: 'hero' };
      jest.spyOn(service, 'findOne').mockResolvedValue(existing);
      repository.remove.mockResolvedValue(existing as any);
      await service.remove('hero');
      expect(repository.remove).toHaveBeenCalledWith(existing);
    });
  });
});
