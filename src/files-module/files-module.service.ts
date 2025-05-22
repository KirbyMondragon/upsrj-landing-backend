// src/files/files-module.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Files } from './entities/files-module.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import {PaginatedImagesDto as PaginatedFilesDto,ImageMetaDto as FileMetaDto,} from 'src/common/dtos/paginated-images.response'; // Renómbralos si quieres para PDFs

@Injectable()
export class FilesModuleService {
  private readonly logger = new Logger(FilesModuleService.name);

  constructor(
    @Inject('FILES_GRIDFS_BUCKET') private readonly bucket: GridFSBucket,
    @InjectRepository(Files) private readonly filesRepository: Repository<Files>,
  ) {}

  /**
   * Sube un archivo PDF al bucket y guarda los metadatos.
   */
  async upload(file: Express.Multer.File): Promise<Files> {
    if (!file?.buffer) {
      throw new BadRequestException('Archivo vacío');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    const uploadStream = this.bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.end(file.buffer);

    const gridFsId: ObjectId = await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => resolve(uploadStream.id));
      uploadStream.on('error', reject);
    });

    this.logger.verbose(`Archivo PDF subido a GridFS => ${gridFsId}`);

    const meta = this.filesRepository.create({
      filename: file.originalname,
      gridFsId,
      contentType: file.mimetype,
    });

    return this.filesRepository.save(meta);
  }

  /**
   * Retorna un stream legible del archivo PDF solicitado.
   */
  async stream(gridId: ObjectId) {
    const meta = await this.filesRepository.findOneBy({ gridFsId: gridId });
    if (!meta) {
      throw new NotFoundException('Archivo no encontrado');
    }

    this.logger.debug(`Streaming PDF ${gridId}`);
    return {
      stream: this.bucket.openDownloadStream(gridId),
      meta,
    };
  }

  /**
   * Lista los archivos PDF paginados.
   */
  async findAll(
    paginationDto?: PaginationDto,
    withMetadata = false,
  ): Promise<PaginatedFilesDto | FileMetaDto[]> {
    const { limit = 10, offset = 0 } = paginationDto || {};
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const [files, total] = await this.filesRepository.findAndCount({
      take: safeLimit,
      skip: safeOffset,
      order: { createdAt: 'DESC' },
    });

    const data = files.map((file) => ({
      id: file.gridFsId.toString(),
      filename: file.filename,
      contentType: file.contentType,
      createdAt: file.createdAt,
      url: `/api/files/pdf/${file.gridFsId}`,
    }));

    return withMetadata
      ? { total, limit: safeLimit, offset: safeOffset, data }
      : data;
  }

  /**
   * Elimina un archivo PDF del bucket y su metadato.
   */
  async deleteFile(gridId: ObjectId): Promise<{ message: string }> {
    const meta = await this.filesRepository.findOneBy({ gridFsId: gridId });
    if (!meta) {
      throw new NotFoundException('Archivo no encontrado');
    }

    try {
      await this.bucket.delete(gridId);
      this.logger.verbose(`Archivo GridFS ${gridId} eliminado`);
    } catch (error: any) {
      this.logger.error(`Error eliminando archivo ${gridId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudo eliminar el archivo');
    }

    await this.filesRepository.delete({ gridFsId: gridId });
    this.logger.verbose(`Metadatos eliminados para ${gridId}`);

    return {
      message: 'Archivo eliminado correctamente',
    };
  }
}
