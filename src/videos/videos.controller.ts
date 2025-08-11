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
  Headers,
  HttpCode,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { videoFileFilter } from './helpers/videoFileFilter.helper';
import { Auth } from 'src/auth/decorators';
import { Video } from './entities/video.entity';
import { UploadFileDto } from 'src/files-module/dto/update-files-module.dto';

@ApiTags('Videos')
@Controller('videos')
@ApiBearerAuth('JWT-auth')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Auth([{ module: 'Images', permission: 'canCreate' }])
  @Post('upload')
  @ApiOperation({ summary: 'Subir un video' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'Video subido y metadatos guardados correctamente.',
    type: Video,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: null, // Dejamos que el servicio maneje el buffer
      fileFilter: videoFileFilter, // Un filtro para videos
      limits: { fileSize: 100_000_000 }, // 100 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<object> {
    if (!file) throw new BadRequestException('Ensure you send a video.');
    const video = await this.videosService.upload(file);
    return {
      message: 'Video uploaded successfully, here is its search ID:',
      gridFsId: video.gridFsId,
    };
  }

  @Get('stream/:id')
  @Auth([{ module: 'Images', permission: 'canDelete' }])
  @ApiOperation({ summary: 'Play/download a video by ID' })
  @ApiParam({ name: 'id', description: 'ObjectId of the video in GridFS' })
  @ApiOkResponse({
    description: 'Returns the video stream (parcial o completo).',
  })
  async streamVideo(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Headers('range') range: string, // <-- Captures the 'Range' header
    @Res() res: Response,
  ) {
    const { headers, stream, statusCode } = await this.videosService.stream(
      id,
      range,
    );

    // Set the status code (200 or 206) and headers
    res.status(statusCode);
    res.set(headers);

    // Send the stream to the client
    stream.pipe(res);
  }

  @Auth([{ module: 'Images', permission: 'canDelete' }])
  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a video by ID' })
  @ApiNoContentResponse({ description: 'Video deleted successfully' })
  async deleteVideo(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
  ): Promise<{ message: string }> {
    return this.videosService.deleteVideo(id);
  }

  @Get('stream')
  @Auth([{ module: 'Images', permission: 'canRead' }])
  @ApiOperation({ summary: 'Get paginated videos' })
  @ApiOkResponse({ description: 'Returns a paginated list of videos.' })
  async getPaginatedVideos(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.videosService.getPaginatedVideos(skip, limit);

    return {
      data,
      total,
      page,
      limit,
    };
  }
}

