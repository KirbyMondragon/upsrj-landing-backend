import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GridFSBucket, ObjectId } from 'mongodb';
import * as crypto from 'crypto';

const mockVideoRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  delete: jest.fn(),
};

const mockGridFSBucket = {
  openUploadStream: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  openDownloadStream: jest.fn(),
};

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: mockVideoRepository,
        },
        {
          provide: 'GRIDFS_BUCKET_VIDEOS',
          useValue: mockGridFSBucket,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVideoMetadata', () => {
    it('debería calcular el hash y retornar los metadatos', async () => {
      const buffer = Buffer.from('test');
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      mockVideoRepository.findOne.mockResolvedValue(null);

      const metadata = { streams: [] };
      jest.spyOn(service as any, 'getVideoMetadata').mockResolvedValue({ metadata, hash });

      const result = await service['getVideoMetadata'](buffer);
      expect(result.hash).toBe(hash);
      expect(result.metadata).toEqual(metadata);
    });

    it('debería lanzar una excepción si el hash ya existe', async () => {
      const buffer = Buffer.from('test');
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      mockVideoRepository.findOne.mockResolvedValue({ hash });

      await expect(service['getVideoMetadata'](buffer)).rejects.toThrow(BadRequestException);
    });
  });

  describe('upload', () => {
    it('debería subir un video y guardar los metadatos', async () => {
      const file = { buffer: Buffer.from('test'), originalname: 'video.mp4', mimetype: 'video/mp4' } as any;
      const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

      const metadata = { streams: [{ codec_type: 'video', duration: 10, width: 1920, height: 1080 }] };
      jest.spyOn(service as any, 'getVideoMetadata').mockResolvedValue({ metadata, hash });

      const uploadStreamMock = {
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'finish') callback();
        }),
        id: new ObjectId(),
      };
      mockGridFSBucket.openUploadStream.mockReturnValue(uploadStreamMock);

      mockVideoRepository.create.mockReturnValue({});
      mockVideoRepository.save.mockResolvedValue({});

      const result = await service.upload(file);

      expect(mockGridFSBucket.openUploadStream).toHaveBeenCalledWith(file.originalname, expect.any(Object));
      expect(mockVideoRepository.create).toHaveBeenCalledWith(expect.objectContaining({ hash }));
      expect(mockVideoRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar una excepción si el archivo está vacío', async () => {
      const file = null;
      await expect(service.upload(file)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPaginatedVideos', () => {
    it('debería retornar los videos paginados', async () => {
      const mockVideos = [
        {
          gridFsId: '68995636e98afae40a9ac89c',
          filename: 'video.mp4',
          contentType: 'video/mp4',
          length: 12345,
          chunkSize: 261120,
          uploadDate: new Date(),
          metadata: {
            width: 1920,
            height: 1080,
            duration: 120,
            hash: 'mock-hash-123',
          },
        },
      ];
      const mockTotal = mockVideos.length;
      mockVideoRepository.findAndCount.mockResolvedValue([mockVideos, mockTotal]);

      const [data, total] = await service.getPaginatedVideos(0, 10);

      expect(data).toHaveLength(1);
      expect(total).toBe(1);
      expect(data[0]).toHaveProperty('metadata.hash');
    });
  });

  describe('deleteVideo', () => {
    it('debería eliminar un video y sus metadatos', async () => {
      const gridFsId = new ObjectId();
      mockVideoRepository.findOne.mockResolvedValue({ gridFsId });

      await service.deleteVideo(gridFsId);

      expect(mockGridFSBucket.delete).toHaveBeenCalledWith(gridFsId);
      expect(mockVideoRepository.delete).toHaveBeenCalledWith({ gridFsId });
    });

    it('debería lanzar una excepción si el video no existe', async () => {
      mockVideoRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteVideo(new ObjectId())).rejects.toThrow(NotFoundException);
    });
  });
});