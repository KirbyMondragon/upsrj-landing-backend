/**
 * FilesModuleController
 * --------------------------------------------------------------------------
 * Maneja la carga, descarga (stream) y eliminación de archivos PDF.
 * Ruta base: /files/pdf
 *
 * Notas de diseño:
 *  - Usa multer.memoryStorage() para recibir archivos en memoria (Buffer).
 *  - Delega toda la lógica de persistencia a FilesModuleService.
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
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { FilesModuleService } from './files-module.service';
import { Auth } from 'src/auth/decorators';
import { FileMetaDto } from './dto/file-meta-module.dto';
import { UploadFileDto } from './dto/update-files-module.dto';

@ApiTags('PDF Files')
@Controller('files/pdf')
@ApiBearerAuth('JWT-auth')
export class FilesModuleController {
  constructor(private readonly filesService: FilesModuleService) {}

  /* ---------------------------------------------------------------------- */
  /*  POST /files/pdf – Carga de archivo PDF                                */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canCreate' }])
  @Post()
  @ApiOperation({ summary: 'Subir un archivo PDF' })
  @ApiCreatedResponse({ type: UploadFileDto, description: 'Archivo PDF subido correctamente' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const isPdf = file.mimetype === 'application/pdf';
        if (!isPdf) {
          return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB máximo
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File): Promise<UploadFileDto> {
    if (!file) {
      throw new BadRequestException('Asegúrate de enviar un archivo PDF');
    }

    const uploadedFile = await this.filesService.upload(file);

    return {
      id: uploadedFile.gridFsId.toString(),
      filename: uploadedFile.filename,
    };
  }

  /* ---------------------------------------------------------------------- */
  /*  GET /files/pdf/:id – Stream de PDF                                    */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canRead' }])
  @Get(':id')
  @ApiOperation({ summary: 'Descargar/visualizar un archivo PDF por ID' })
  @ApiParam({ name: 'id', description: 'ObjectId del archivo PDF' })
  @ApiOkResponse({ description: 'Devuelve el archivo PDF solicitado (stream)' })
  async get(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Res() res: Response,
  ) {
    const { stream, meta } = await this.filesService.stream(id);

    res.setHeader('Content-Type', meta.contentType);

    return stream.pipe(res);
  }

  /* ---------------------------------------------------------------------- */
  /*  GET /files/pdf – Listar archivos PDF (paginados o no)                 */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canRead' }])
  @Get()
  @ApiOperation({ summary: 'Listar archivos PDF (paginados o sin metadata)' })
  @ApiOkResponse({
    description: 'Array plano o paginado',
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: getSchemaPath(FileMetaDto) } },
        { $ref: getSchemaPath(PaginationDto) },
      ],
    },
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'withMetadata', required: false, type: Boolean, example: true })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('withMetadata') withMetadata: string,
  ): Promise<PaginationDto | FileMetaDto[]> {
    const includeMetadata = withMetadata === 'true';
    return this.filesService.findAll(paginationDto, includeMetadata);
  }

  /* ---------------------------------------------------------------------- */
  /*  DELETE /files/pdf/:id – Eliminar archivo PDF (binario + metadatos)    */
  /* ---------------------------------------------------------------------- */

  @Auth([{ module: 'Images', permission: 'canDelete' }])
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un archivo PDF por ID' })
  @ApiParam({ name: 'id', description: 'ObjectId del archivo PDF' })
  @ApiNoContentResponse({ description: 'Archivo PDF eliminado correctamente' })
  async deleteFile(@Param('id', ParseObjectIdPipe) id: ObjectId): Promise<{ message: string }> {
    return this.filesService.deleteFile(id);
  }
}
