
// src/files/dto/upload-file.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    description: 'ID del archivo almacenado en GridFS',
    type: String,
    example: '60d5ecb9f1e9d12a3c123456',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre original o generado del archivo',
    type: String,
    example: 'documento.pdf',
  })
  filename: string;
}
