import { Controller, Get, Post, Param, Delete, Body, Res, HttpStatus, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ImageService } from './image.service';
import { CreateImageDto } from './dto/create-image.dto';

/**
 * Controlador para la gestión de imágenes
 * 
 * Proporciona endpoints RESTful para cargar, obtener y eliminar imágenes
 * Las imágenes se procesan mediante Sharp y se almacenan en GridFS de MongoDB
 */
@ApiTags('Imágenes')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  /**
   * Sube una nueva imagen al servidor
   * 
   * Procesa una imagen en base64, la redimensiona utilizando Sharp,
   * la convierte a formato WebP y la almacena en GridFS
   * 
   * @param createImageDto DTO con la imagen en base64 y configuraciones
   * @returns Objeto con el URL e ID de la imagen guardada
   */
  @Post()
  @ApiOperation({ summary: 'Subir una nueva imagen' })
  @ApiResponse({ status: 201, description: 'Imagen subida correctamente' })
  @ApiResponse({ status: 400, description: 'Datos de imagen inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async uploadImage(@Body() createImageDto: CreateImageDto) {
    return this.imageService.uploadImage(createImageDto);
  }

  /**
   * Obtiene la lista de todas las imágenes disponibles
   * 
   * @returns Array con los metadatos de las imágenes activas
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las imágenes' })
  @ApiResponse({ status: 200, description: 'Lista de imágenes disponibles' })
  async findAll() {
    return this.imageService.findAll();
  }

  /**
   * Obtiene una imagen específica por su UUID
   * 
   * Devuelve la imagen como un archivo binario stream desde GridFS
   * Este endpoint se usa directamente en las etiquetas <img> del frontend
   * 
   * @param uuid UUID de la imagen a obtener
   * @param res Objeto Response de Express
   * @returns StreamableFile con la imagen
   */
  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener una imagen por su UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID de la imagen' })
  @ApiResponse({ status: 200, description: 'Imagen encontrada' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async getImage(
    @Param('uuid') uuid: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, contentType } = await this.imageService.getImageByUuid(uuid);
    
    // Configurar headers para la respuesta
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${uuid}.webp"`,
    });
    
    // Devolver la imagen como stream
    return new StreamableFile(stream);
  }

  /**
   * Elimina una imagen por su UUID
   * 
   * No elimina físicamente la imagen de GridFS, solo la marca como inactiva
   * 
   * @param uuid UUID de la imagen a eliminar
   * @returns Mensaje de confirmación
   */
  @Delete(':uuid')
  @ApiOperation({ summary: 'Eliminar una imagen por su UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID de la imagen a eliminar' })
  @ApiResponse({ status: 200, description: 'Imagen eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async deleteImage(@Param('uuid') uuid: string) {
    return this.imageService.deleteImage(uuid);
  }
}
