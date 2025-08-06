import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @Inject('GRIDFS_BUCKET_VIDEOS') private readonly bucket: GridFSBucket,
    @InjectRepository(Video) private readonly videoRepository: Repository<Video>,
  ) {}

  /**
   * Extrae metadatos del video (duración, dimensiones) usando ffprobe.
   */
  private async getVideoMetadata(buffer: Buffer): Promise<ffmpeg.FfprobeData> {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `video-meta-${Date.now()}.tmp`);

    // Escribe el buffer a un archivo temporal
    await fs.promises.writeFile(tmpFilePath, buffer);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tmpFilePath, (err, metadata) => {
        // Elimina el archivo temporal después de obtener los metadatos
        fs.promises.unlink(tmpFilePath).catch(() => {});
        if (err) return reject(new BadRequestException('No se pudieron procesar los metadatos del video.'));
        resolve(metadata);
      });
    });
  }

  /**
   * Sube un video, extrae sus metadatos y guarda la referencia.
   */
  async upload(file: Express.Multer.File): Promise<Video> {
    if (!file?.buffer) throw new BadRequestException('Archivo vacío.');

    // 1️⃣ Extraer metadatos del video
    const metadata = await this.getVideoMetadata(file.buffer);
    const videoStreamMeta = metadata.streams.find((s) => s.codec_type === 'video');

    if (!videoStreamMeta) {
      throw new BadRequestException('El archivo no parece ser un video válido.');
    }
    
    const { duration, width, height } = videoStreamMeta;

    // 2️⃣ Subir a GridFS
    const uploadStream = this.bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.end(file.buffer);

    const gridFsId: ObjectId = await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => resolve(uploadStream.id));
      uploadStream.on('error', reject);
    });

    this.logger.verbose(`Video almacenado en GridFS => ${gridFsId}`);

    // 3️⃣ Persistir metadatos en la base de datos
    const video = this.videoRepository.create({
      gridFsId,
      filename: file.originalname,
      contentType: file.mimetype,
      duration: Math.round(Number(duration) || 0),
      width: width || 0,
      height: height || 0,
    });

    return this.videoRepository.save(video);
  }

  /**
   * Prepara un stream de video que soporta peticiones de rango.
   */
  async stream(id: ObjectId, rangeHeader: string | undefined) {
    // Busca el archivo directamente en GridFS para obtener su tamaño total
    const file = await this.bucket.find({ _id: id }).next();
    if (!file) throw new NotFoundException('Video no encontrado.');

    const totalSize = file.length;

    // Si no hay encabezado 'Range', enviamos el video completo (menos común)
    if (!rangeHeader) {
      return {
        headers: {
          'Content-Length': totalSize,
          'Content-Type': file.contentType,
        },
        stream: this.bucket.openDownloadStream(id),
        statusCode: 200, // OK
      };
    }

    // 🎬 Lógica para procesar el rango
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : totalSize - 1;
    const chunkSize = end - start + 1;

    // Prepara el stream de GridFS con el rango especificado
    const stream = this.bucket.openDownloadStream(id, { start, end });

    return {
      headers: {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': file.contentType,
      },
      stream,
      statusCode: 206, // Partial Content
    };
  }
  
  // Los métodos findAll y deleteImage son prácticamente idénticos,
  // solo cambian la entidad y los mensajes.
  
  async deleteVideo(gridId: ObjectId): Promise<{ message: string }> {
    const meta = await this.videoRepository.findOneBy({ gridFsId: gridId });
    if (!meta) throw new NotFoundException('Video no encontrado');

    try {
      await this.bucket.delete(gridId);
      this.logger.verbose(`Archivo GridFS ${gridId} eliminado`);
    } catch (err: any) {
      this.logger.error(`Error al borrar GridFS ${gridId}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('No se pudo eliminar el video del almacenamiento.');
    }

    await this.videoRepository.delete({ gridFsId: gridId });
    this.logger.verbose(`Metadatos Video ${gridId} eliminados`);

    return { message: 'Video eliminado correctamente' };
  }
}