// src/files/dto/file-meta.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class FileMetaDto {
  @ApiProperty({ type: String, example: '60d5ecb9f1e9d12a3c123456' })
  id: string;

  @ApiProperty({ type: String, example: 'documento.pdf' })
  filename: string;

  @ApiProperty({ type: String, example: 'application/pdf' })
  contentType: string;

  @ApiProperty({ type: Date, example: '2023-05-17T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ type: String, example: '/api/files/pdf/60d5ecb9f1e9d12a3c123456' })
  url: string;
}
