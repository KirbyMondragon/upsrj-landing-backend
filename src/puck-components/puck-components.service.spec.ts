import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { PuckComponentsService } from './puck-components.service';
import { PuckComponent } from './entities/puck-component.entity';
import { CreatePuckComponentDto } from './dto/create-puck-component.dto';
import { UpdatePuckComponentDto } from './dto/update-puck-component.dto';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

// Mock para PaginationDto en lugar de importarlo
class PaginationDto {
  limit?: number;
  offset?: number;
}

// Mock de los datos para pruebas
const mockPuckComponent = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  content: {
    type: 'section',
    props: {
      id: 'test-id',
      title: 'Test Title',
      description: 'Test Description'
    }
  },
  root: {
    props: {
      title: 'Root Title'
    }
  },
  zones: {
    main: [
      {
        type: 'component',
        props: {
          id: 'zone-component',
          title: 'Zone Title'
        }
      }
    ]
  }
};

const mockCreateDto: CreatePuckComponentDto = {
  content: {
    type: 'section',
    props: {
      id: 'test-id',
      title: 'Test Title',
      description: 'Test Description'
    }
  },
  root: {
    props: {
      title: 'Root Title'
    }
  },
  zones: {
    main: [
      {
        type: 'component',
        props: {
          id: 'zone-component',
          title: 'Zone Title'
        }
      }
    ]
  }
};

const mockUpdateDto: UpdatePuckComponentDto = {
  content: {
    type: 'section',
    props: {
      id: 'test-id',
      title: 'Updated Title',
      description: 'Updated Description'
    }
  }
};

// Mock del repositorio
const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

describe('PuckComponentsService', () => {
  let service: PuckComponentsService;
  let repository: MongoRepository<PuckComponent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuckComponentsService,
        {
          provide: getRepositoryToken(PuckComponent),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PuckComponentsService>(PuckComponentsService);
    repository = module.get<MongoRepository<PuckComponent>>(getRepositoryToken(PuckComponent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new puck component if slug does not exist', async () => {
      // Arrange
      const slug = 'test-slug';
      const mockCreateDtoWithSlug = { ...mockCreateDto, slug };
      const createdComponent = { ...mockPuckComponent, slug };

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null); // No component exists
      jest.spyOn(repository, 'save').mockResolvedValue(createdComponent as any);

      // Act
      const result = await service.create(mockCreateDtoWithSlug);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({ slug });
      expect(repository.save).toHaveBeenCalledWith(mockCreateDtoWithSlug);
      expect(result).toEqual(createdComponent);
    });

    it('should update an existing puck component if slug exists', async () => {
      // Arrange
      const slug = 'existing-slug';
      const mockCreateDtoWithSlug = { ...mockCreateDto, slug };
      const existingComponent = { ...mockPuckComponent, slug, id: new ObjectId() };

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(existingComponent as any);
      jest.spyOn(service, 'update').mockResolvedValue({ ...existingComponent, ...mockCreateDtoWithSlug } as any);

      // Act
      const result = await service.create(mockCreateDtoWithSlug);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({ slug });
      expect(service.update).toHaveBeenCalledWith(slug, mockCreateDtoWithSlug);
      expect(result).toEqual({ ...existingComponent, ...mockCreateDtoWithSlug });
    });
  });

  describe('findAll', () => {
    it('should return an array of puck components with default pagination', async () => {
      // Arrange
      const mockComponents = [mockPuckComponent];
      jest.spyOn(repository, 'find').mockResolvedValue(mockComponents as any);

      // Act
      const result = await service.findAll();

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        take: 10,
        skip: 0
      });
      expect(result).toEqual(mockComponents);
    });

    it('should return an array of puck components with custom pagination', async () => {
      // Arrange
      const mockComponents = [mockPuckComponent];
      const paginationDto: PaginationDto = { limit: 5, offset: 10 };
      jest.spyOn(repository, 'find').mockResolvedValue(mockComponents as any);

      // Act
      const result = await service.findAll(paginationDto);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        take: 5,
        skip: 10
      });
      expect(result).toEqual(mockComponents);
    });
  });

  describe('findOne', () => {
    it('should find and return a puck component by slug', async () => {
      // Arrange
      const mockSlug = 'test-slug';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockPuckComponent as any);

      // Act
      const result = await service.findOne(mockSlug);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({ slug: mockSlug });
      expect(result).toEqual(mockPuckComponent);
    });

    it('should throw NotFoundException if component not found', async () => {
      // Arrange
      const mockSlug = 'non-existent-slug';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(mockSlug)).rejects.toThrow(NotFoundException);
      expect(repository.findOneBy).toHaveBeenCalledWith({ slug: mockSlug });
    });
  });

  describe('update', () => {
    it('should update and return a puck component', async () => {
      // Arrange
      const mockSlug = 'test-slug';
      const updatedComponent = {
        ...mockPuckComponent,
        content: {
          ...mockPuckComponent.content,
          props: {
            ...mockPuckComponent.content.props,
            title: 'Updated Title',
            description: 'Updated Description'
          }
        }
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPuckComponent as any);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedComponent as any);

      // Act
      const result = await service.update(mockSlug, mockUpdateDto);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockSlug);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedComponent);
    });
  });

  describe('remove', () => {
    it('should remove a puck component', async () => {
      // Arrange
      const mockSlug = 'test-slug';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPuckComponent as any);
      jest.spyOn(repository, 'remove').mockResolvedValue(undefined);

      // Act
      await service.remove(mockSlug);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockSlug);
      expect(repository.remove).toHaveBeenCalledWith(mockPuckComponent);
    });
  });
});