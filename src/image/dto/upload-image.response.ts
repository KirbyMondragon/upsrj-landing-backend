// src/images/dto/upload-image.response.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UploadImageResponseDto {
  @ApiProperty({ example: '661fd9b8217f4f9292c2c5cd' })
  id: string;

}
