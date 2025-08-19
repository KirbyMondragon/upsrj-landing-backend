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
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg'; //TODO: instalar ffmpeg en docker
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { Readable } from 'stream';
import * as crypto from 'crypto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @Inject('GRIDFS_BUCKET_VIDEOS') private readonly bucket: GridFSBucket,
    @InjectRepository(Video) private readonly videoRepository: Repository<Video>,
  ) {
      //Indicar a fluent-ffmpeg la ruta de ambos binarios
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
      ffmpeg.setFfprobePath(ffprobeInstaller.path);

      this.logger.log(`Ruta de FFmpeg establecida: ${ffmpegInstaller.path}`);
      this.logger.log(`Ruta de FFprobe establecida: ${ffprobeInstaller.path}`);
  }

  /**
   * Extrae metadatos del video (duración, dimensiones) usando ffprobe.
   */
  private async getVideoMetadata(buffer: Buffer): Promise<{ metadata: ffmpeg.FfprobeData; hash: string }> {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `video-meta-${Date.now()}.tmp`);

    // Calcular el hash del archivo
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Verificar si el hash ya existe en la base de datos
    const existingVideo = await this.videoRepository.findOne({ where: { hash } });
    if (existingVideo) {
        throw new BadRequestException('El video ya existe en el sistema.');
    }

    // Escribe el buffer a un archivo temporal
    await fs.promises.writeFile(tmpFilePath, buffer);

    const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
      ffmpeg.ffprobe(tmpFilePath, (err, metadata) => {
        fs.promises.unlink(tmpFilePath).catch(e => this.logger.warn(`No se pudo eliminar el archivo temporal: ${tmpFilePath}`, e));
        if (err) {
          this.logger.error(`ffprobe falló al procesar el archivo.`, err.stack); return reject(new BadRequestException('No se pudieron procesar los metadatos del video.'));
        }
        resolve(metadata);
      });
    });

    return { metadata, hash };
  }

  /**
   * Sube un video, extrae sus metadatos y guarda la referencia.
   */
  async upload(file: Express.Multer.File): Promise<Video> {
    if (!file?.buffer) throw new BadRequestException('Archivo vacío.');

    // 1️⃣ Extraer metadatos del video
    const { metadata, hash } = await this.getVideoMetadata(file.buffer);
    const videoStreamMeta = metadata.streams.find((s) => s.codec_type === 'video');

    if (!videoStreamMeta) {
      throw new BadRequestException('El archivo no parece ser un video válido.');
    }

    const { duration, width, height } = videoStreamMeta;

    // 2️⃣ Subir a GridFS
    const uploadStream = this.bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      chunkSizeBytes: 255 * 1024, // 255 KB
    });
    uploadStream.end(file.buffer);

    const gridFsId: ObjectId = await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => resolve(uploadStream.id));
      uploadStream.on('error', (err) => {
        this.logger.error(`Error al subir video: ${err.message}`);
        reject(err);
      });
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
      hash, // Agregar el hash calculado al guardar el video
    });
    this.logger.verbose(`Metadatos del video guardados en la base de datos`);
    return this.videoRepository.save(video);
  }

  /**
   * Prepara un stream de video que soporta peticiones de rango.
   */
  async stream(id: ObjectId, rangeHeader: string | undefined) {
    // Busca el archivo directamente en GridFS para obtener su tamaño total
    const file = await this.bucket.find({ _id: id }).next();
    if (!file) {
      throw new NotFoundException('Video no encontrado.');
    }

    const totalSize = file.length;

    // Si no hay encabezado 'Range', enviamos el video completo (menos común)
    if (!rangeHeader) {
      return {
        headers: {
          'Content-Length': totalSize,
          'Content-Type': file.contentType,
        },
        stream: this.bucket.openDownloadStream(file._id),
        statusCode: 200, // OK
      };
    }

    // 🎬 Lógica para procesar el rango
    const rangeMatch = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!rangeMatch) {
      throw new BadRequestException('Encabezado Range no válido. Formato esperado: bytes=<start>-<end>.');
    }

    const startStr = rangeMatch[1];
    const endStr = rangeMatch[2];

    const start = startStr ? parseInt(startStr, 10) : 0;
    const end = endStr ? parseInt(endStr, 10) : totalSize - 1;

    if (isNaN(start) || isNaN(end) || start < 0 || end >= totalSize || start > end) {
      throw new BadRequestException('Rango de bytes no válido.');
    }

    const chunkSize = end - start + 1;

    // Prepara el stream de GridFS con el rango especificado
    const stream = this.bucket.openDownloadStream(file._id, { start, end });

    stream.on('error', (err) => {
      this.logger.error(`Error al leer el stream de GridFS: ${err.message}`);
      throw new InternalServerErrorException('Error al procesar el stream del video.');
    });

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
    const meta = await this.videoRepository.findOne({ where: { gridFsId: gridId } });
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

  async getPaginatedVideos(skip: number, limit: number) {
    const [data, total] = await this.videoRepository.findAndCount({
      skip,
      take: limit,
    });
    // Desestructurar y modificar los datos si es necesario
    const modifiedData = data.map(video => ({
      gridFsId: video.gridFsId.toString(), // Convertir ObjectId a string
      filename: video.filename,
      contentType: video.contentType,
      duration: video.duration,
      width: video.width,
      height: video.height,
      hash: video.hash, // Incluir el hash en los datos retornados
    }));

    return [modifiedData, total];
  }
}