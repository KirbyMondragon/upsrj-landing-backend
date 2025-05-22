/**
 * ImagesController
 * --------------------------------------------------------------------------
 * Maneja la carga, descarga (stream) y eliminación de imágenes de producto.
 * Ruta base: /files/product
 *
 * Notas de diseño:
 *  - Usa multer.memoryStorage() para recibir archivos en memoria (Buffer).
 *  - Delega toda la lógica de persistencia a ImagesService.
 *  - Cada endpoint está documentado con Swagger/OpenAPI.
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  UploadedFile,
  UseInterceptors,
  Res,
  Param,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { UploadImageResponseDto } from './dto/upload-image.response';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ImagesService } from './image.service';
import { fileFilter } from './helpers/fileFilter.helper';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Image } from './entities/image.entity';
import { ImageMetaDto, PaginatedImagesDto } from 'src/common/dtos/paginated-images.response';
import { Auth } from 'src/auth/decorators';

@ApiTags('Images')                    // Grupo Swagger
@Controller('files/images')
@ApiBearerAuth('JWT-auth')          // Prefijo de ruta
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /* ---------------------------------------------------------------------- */
  /*  POST /files/product – Carga de imagen                                 */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canCreate'}])
  @Post()
  @ApiOperation({ summary: 'Subir una imagen de producto' })
  @ApiCreatedResponse({ type: UploadImageResponseDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      // Guarda el archivo en memoria; luego lo enviamos a GridFS
      storage: multer.memoryStorage(),
      fileFilter,                      // Valida tipo MIME/extensión
      limits: { fileSize: 10_000_000 }, // 10 MB máximo
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    // ── Validación básica ──
    if (!file) {
      throw new BadRequestException('Asegúrate de enviar una imagen');
    }

    // Delegamos el guardado al servicio
    const image = await this.imagesService.upload(file);


    // Construimos la respuesta estándar
    return {
      id: image.gridFsId.toString(),
      //url: `/api/files/product/${image.gridFsId}`,
    };
  }

  /* ---------------------------------------------------------------------- */
  /*  GET /files/product/:id – Stream de imagen                             */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canRead'}])
  @Get(':id')
  @ApiOperation({ summary: 'Descargar/visualizar una imagen por ID' })
  @ApiParam({ name: 'id', description: 'ObjectId de la imagen' })
  @ApiOkResponse({ description: 'Devuelve la imagen solicitada (stream)' })
  async get(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Res() res: Response,
  ) {
    // Recupera el stream desde GridFS y los metadatos (para Content‑Type)
    const { stream, meta } = await this.imagesService.stream(id);

    // Establece el tipo de contenido antes de hacer pipe
    res.setHeader('Content-Type', meta.contentType);

    // Envía el stream al cliente
    return stream.pipe(res);
  }

 /** Lista paginada de imágenes (metadatos + URL) */
@Auth([{ module: 'Images', permission: 'canRead'}]) // Permiso para leer imágenes
@Get()
@ApiOperation({ summary: 'Listar imágenes (paginadas o sin metadata)' })
@ApiOkResponse({ description: 'Array plano o paginado', schema: {
  oneOf: [
    { type: 'array', items: { $ref: getSchemaPath(ImageMetaDto) } },
    { $ref: getSchemaPath(PaginatedImagesDto) },
  ],
}})
@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
@ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
@ApiQuery({ name: 'withMetadata', required: false, type: Boolean, example: true })
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('withMetadata') withMetadata: string,
): Promise<PaginatedImagesDto | ImageMetaDto[]> {
  const includeMetadata = withMetadata === 'true';
  return this.imagesService.findAll(paginationDto, includeMetadata);
}


  /* ---------------------------------------------------------------------- */
  /*  DELETE /files/product/:id – Elimina imagen (binario + metadatos)      */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canDelete'}])
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una imagen por ID' })
  @ApiParam({ name: 'id', description: 'ObjectId de la imagen' })
  @ApiNoContentResponse({ description: 'Imagen eliminada correctamente' })
  async deleteImage(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
  ): Promise<{ message: string }> {
    return this.imagesService.deleteImage(id);
  }
}
