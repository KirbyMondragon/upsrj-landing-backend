import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, MongoClient, MongoRepository } from 'typeorm';
import { GridFSBucket, ObjectId } from 'mongodb';
import * as sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { Image } from './entities/image.entity';
import { CreateImageDto } from './dto/create-image.dto';

/**
 * Servicio para la gestión de imágenes utilizando GridFS y MongoDB
 * 
 * Este servicio proporciona funcionalidades para:
 * - Procesar imágenes con Sharp (redimensionamiento, optimización)
 * - Almacenar imágenes en GridFS de MongoDB
 * - Recuperar imágenes como streams
 * - Gestionar metadatos de imágenes
 */
@Injectable()
export class ImageService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectRepository(Image)
    private readonly imageRepository: MongoRepository<Image>,
  ) {
    // Inicializar el GridFSBucket para almacenar imágenes
    // Acceder a la instancia nativa de MongoDB 
    const mongoClient = this.connection.driver['queryRunner'].databaseConnection as MongoClient;
    const db = mongoClient.db() as unknown as import('mongodb').Db;
    
    this.gridFSBucket = new GridFSBucket(db, {
      bucketName: 'images' // Nombre del bucket de GridFS para almacenar imágenes
    });
  }

  /**
   * Procesa y sube una imagen en base64 a GridFS
   * 
   * @param createImageDto DTO con la imagen en base64 y configuraciones de redimensionamiento
   * @returns Objeto con el ID y URL de la imagen procesada
   */
  async uploadImage(createImageDto: CreateImageDto): Promise<{ success: boolean; imageId: string; imageUrl: string }> {
    try {
      // Extraer los datos de base64 (eliminar el prefijo data:image/xxx;base64,)
      const base64Regex = /^data:image\/\w+;base64,/;
      const base64Data = createImageDto.base64Image.replace(base64Regex, '');
      
      // Configurar dimensiones para el redimensionamiento
      const width = createImageDto.width || 300;
      const height = createImageDto.height || 300;

      // Procesar la imagen con sharp:
      // 1. Convertir base64 a buffer
      // 2. Redimensionar según las dimensiones especificadas
      // 3. Convertir a formato WebP para mejor rendimiento
      const resizedImageBuffer = await sharp(Buffer.from(base64Data, 'base64'))
        .resize(width, height, { fit: 'cover' })
        .webp()
        .toBuffer();

      // Generar un ID único para la imagen usando UUID v4
      const imageId = uuid();

      // Subir la imagen procesada a GridFS
      let gridFsId: ObjectId;
      try {
        gridFsId = await this.uploadToGridFS(imageId, resizedImageBuffer);
      } catch (error) {
        throw new InternalServerErrorException('Error uploading image to GridFS');
      }

      // Construir la URL para acceder a la imagen desde el frontend
      const imageUrl = `/images/${imageId}`;      // Guardar los metadatos en la colección de imágenes de MongoDB
      const newImage = this.imageRepository.create({
        uuid: imageId,
        image: imageUrl,
        gridFsId: gridFsId,
        isActive: true // Asegurarnos de que la imagen se crea con estado activo
      });

      await this.imageRepository.save(newImage);

      return {
        success: true,
        imageId,
        imageUrl, // Esta URL es la que se usará en Puck para mostrar la imagen
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error processing image');
    }
  }

  /**
   * Sube un buffer de imagen a GridFS
   * 
   * @param filename Nombre del archivo (UUID de la imagen)
   * @param buffer Buffer de la imagen procesada
   * @returns Promise con el ObjectId asignado por GridFS
   */
  private async uploadToGridFS(filename: string, buffer: Buffer): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      // Crear un stream de escritura en GridFS
      const uploadStream = this.gridFSBucket.openUploadStream(filename, {
        metadata: { contentType: 'image/webp' } // Definir el tipo de contenido como WebP
      });

      // Manejar eventos del stream
      uploadStream.on('finish', () => resolve(uploadStream.id)); // Resolver con el ID cuando finalice
      uploadStream.on('error', (error) => reject(error)); // Rechazar si hay un error
      
      // Escribir el buffer en el stream y finalizar
      uploadStream.end(buffer);
    });
  }

  /**
   * Recupera una imagen desde GridFS por su UUID
   * 
   * @param uuid UUID de la imagen a recuperar
   * @returns Objeto con el stream de la imagen y su tipo de contenido
   */
  async getImageByUuid(uuid: string): Promise<{ stream: any; contentType: string }> {
    try {
      // Buscar la metadata de la imagen en la colección
      const image = await this.imageRepository.findOne({ where: { uuid, isActive: true } });
      
      if (!image) {
        throw new NotFoundException(`Image with UUID ${uuid} not found`);
      }

      // Abrir stream de lectura desde GridFS usando el ID almacenado
      const downloadStream = this.gridFSBucket.openDownloadStream(image.gridFsId);
      
      return {
        stream: downloadStream, // Stream que se enviará al cliente
        contentType: 'image/webp' // Tipo de contenido para HTTP response
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving image');
    }
  }

  /**
   * Elimina una imagen por su UUID (marcado como inactivo)
   * 
   * Nota: No se elimina físicamente de GridFS, solo se marca como inactivo
   * 
   * @param uuid UUID de la imagen a eliminar
   * @returns Objeto con el resultado de la operación
   */
  async deleteImage(uuid: string): Promise<{ success: boolean; message: string }> {
    try {
      const image = await this.imageRepository.findOne({ where: { uuid } });
      
      if (!image) {
        throw new NotFoundException(`Image with UUID ${uuid} not found`);
      }
      
      // Actualizar el estado a inactivo en lugar de eliminar físicamente
      await this.imageRepository.update(image._id, { isActive: false });

      return {
        success: true,
        message: 'Image deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error deleting image');
    }
  }  /**
   * Lista todas las imágenes activas
   * 
   * @returns Array de entidades Image activas
   */
  async findAll(): Promise<Image[]> {
    console.log('Buscando todas las imágenes en la base de datos...');
    try {
      // Primero intentamos obtener todas las imágenes (activas o no) para diagnóstico
      const allImages = await this.imageRepository.find();
      console.log(`Total de imágenes en la base de datos: ${allImages.length}`);
      
      // Temporalmente retornamos todas las imágenes sin filtrar por isActive
      console.log('Retornando todas las imágenes sin filtrar por isActive');
      return allImages;
    } catch (error) {
      console.error('Error al buscar imágenes:', error);
      return [];
    }
  }

  /**
   * Método temporal para activar todas las imágenes existentes en la base de datos
   * 
   * @returns Número de imágenes activadas
   */
  async activateAllImages(): Promise<number> {
    try {
      // Buscar todas las imágenes inactivas
      const inactiveImages = await this.imageRepository.find({ where: { isActive: false } });
      console.log(`Encontradas ${inactiveImages.length} imágenes inactivas para activar`);
      
      if (inactiveImages.length === 0) {
        return 0;
      }
      
      // Actualizar cada imagen para activarla
      for (const image of inactiveImages) {
        await this.imageRepository.update(image._id, { isActive: true });
      }
      
      console.log(`${inactiveImages.length} imágenes han sido activadas correctamente`);
      return inactiveImages.length;
    } catch (error) {
      console.error('Error al activar imágenes:', error);
      throw new InternalServerErrorException('Error activating images');
    }
  }
}
