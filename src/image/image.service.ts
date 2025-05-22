// src/images/images.service.ts
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
import * as sharp from 'sharp';

import { Image } from './entities/image.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaginatedImagesDto, ImageMetaDto } from 'src/common/dtos/paginated-images.response';

/**
 * Lógica de negocio para subir y descargar imágenes mediante GridFS.
 */
@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @Inject('GRIDFS_BUCKET') private readonly bucket: GridFSBucket,
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
  ) {}

  /**
   * Sube una imagen al bucket y persiste sus metadatos.
   * Devuelve la entidad resultante.
   */
  async upload(file: Express.Multer.File): Promise<Image> {
    if (!file?.buffer) {
      throw new BadRequestException('Archivo vacío');
    }

    // 1️⃣  Procesado opcional (resize / conversión):
    const processedBuffer = await sharp(file.buffer)
    .resize({ height: 1080 }) // mantiene el aspecto original
    .webp() // convierte a formato webp
    .toBuffer();

    const contentType = file.mimetype; // mantenemos MIME original

    // 2️⃣  Subida a GridFS:
    const uploadStream = this.bucket.openUploadStream(file.originalname, {
      contentType,
    });
    uploadStream.end(processedBuffer);

    const gridFsId: ObjectId = await new Promise((res, rej) => {
      uploadStream.on('finish', () => res(uploadStream.id));
      uploadStream.on('error', rej);
    });

    this.logger.verbose(`Imagen almacenada en GridFS => ${gridFsId}`);

    // 3️⃣  Persistimos metadatos:
    const image = this.imageRepository.create({
      filename: file.originalname,
      gridFsId,
      contentType,
    });

    return this.imageRepository.save(image);
  }

  /**
   * Devuelve un stream legible con la imagen solicitada.
   * Lanza 404 si el metadato no existe.
   */
  async stream(gridId: ObjectId) {
    const meta = await this.imageRepository.findOneBy({ gridFsId: gridId });
    if (!meta) {
      throw new NotFoundException('Imagen no encontrada');
    }

    this.logger.debug(`Streaming imagen ${gridId}`);
    return { stream: this.bucket.openDownloadStream(gridId), meta };
  }


 /**
 * Devuelve una página de imágenes con metadatos y la URL para
 * descargarlas/visualizarlas individualmente.
 */
async findAll(
  paginationDto?: PaginationDto,
  withMetadata: boolean = false, // decide si devolver metadatos o no
): Promise<PaginatedImagesDto | ImageMetaDto[]> {

  const { limit = 10, offset = 0 } = paginationDto || {};
  const safeLimit  = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.max(offset, 0);

  const [images, total] = await this.imageRepository.findAndCount({
    take: safeLimit,
    skip: safeOffset,
    order: { createdAt: 'DESC' },
  });

  const data = images.map(img => ({
    id:         img.gridFsId.toString(),
    filename:   img.filename,
    contentType: img.contentType,
    createdAt:  img.createdAt,
    url:        `/api/files/product/${img.gridFsId}`,
  }));

  if (withMetadata) {
    return {
      total,
      limit: safeLimit,
      offset: safeOffset,
      data,
    };
  }

  return data;
}



  /**
   * Elimina la imagen (archivo + metadatos).
   * @returns { id: string, deleted: boolean }
   */
  async deleteImage(gridId: ObjectId): Promise<{ message: string }> {
    // 1️⃣  Verifica que exista el metadato (sin abrir streams)
    const meta = await this.imageRepository.findOneBy({ gridFsId: gridId });
    if (!meta) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // 2️⃣  Borra el archivo binario de GridFS
    try {
      await this.bucket.delete(gridId);
      this.logger.verbose(`Archivo GridFS ${gridId} eliminado`);
    } catch (err: any) {
      this.logger.error(`Error al borrar GridFS ${gridId}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('No se pudo eliminar la imagen');
    }

    // 3️⃣  Borra el documento de metadatos
    await this.imageRepository.delete({ gridFsId: gridId });
    this.logger.verbose(`Metadatos Image ${gridId} eliminados`);

    return { 
      // id: gridId.toString(), 
      // deleted: true,
      message: 'Imagen eliminada correctamente',
    };
  }
}
