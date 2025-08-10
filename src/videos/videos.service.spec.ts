import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { GridFSBucket } from 'mongodb';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

const mockVideoRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
};

const mockGridFSBucket = {
  openUploadStream: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  openDownloadStream: jest.fn(),
};

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useValue: mockVideoRepository },
        { provide: 'GRIDFS_BUCKET_VIDEOS', useValue: mockGridFSBucket },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('debería lanzar un error si el archivo está vacío', async () => {
      await expect(service.upload(null)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar un error si no se pueden extraer metadatos', async () => {
      jest.spyOn(service as any, 'getVideoMetadata').mockRejectedValue(new BadRequestException('Error de metadatos'));

      const mockFile = { buffer: Buffer.from('test'), originalname: 'test.mp4', mimetype: 'video/mp4' } as any;

      await expect(service.upload(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('debería guardar el video y devolverlo', async () => {
      jest.spyOn(service as any, 'getVideoMetadata').mockResolvedValue({
        streams: [{ codec_type: 'video', duration: 10, width: 1920, height: 1080 }],
      });

      const mockFile = { buffer: Buffer.from('test'), originalname: 'test.mp4', mimetype: 'video/mp4' } as any;

      mockGridFSBucket.openUploadStream.mockReturnValue({
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'finish') callback();
        }),
        id: 'mockId',
      });

      mockVideoRepository.create.mockReturnValue({});
      mockVideoRepository.save.mockResolvedValue({});

      const result = await service.upload(mockFile);

      expect(result).toBeDefined();
      expect(mockVideoRepository.save).toHaveBeenCalled();
    });
  });
});
