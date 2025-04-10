import { IsBase64, IsNotEmpty, IsOptional, IsNumber, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la creación de una nueva imagen
 * 
 * Contiene la imagen en formato base64 y opciones de redimensionamiento
 */
export class CreateImageDto {
  /**
   * Imagen en formato base64
   * Debe incluir el prefijo data:image/xxx;base64,
   */
  @ApiProperty({
    description: 'Imagen en formato base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAk...'
  })
  @IsNotEmpty({ message: 'La imagen es requerida' })
  @Validate(IsBase64, { message: 'La imagen debe estar en formato base64 válido' })
  base64Image: string;

  /**
   * Ancho deseado para la imagen (en píxeles)
   * Si no se proporciona, se usará el valor predeterminado de 300px
   */
  @ApiProperty({
    description: 'Ancho de la imagen a redimensionar',
    example: 300,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ancho debe ser un número' })
  width?: number;

  /**
   * Alto deseado para la imagen (en píxeles)
   * Si no se proporciona, se usará el valor predeterminado de 300px
   */
  @ApiProperty({
    description: 'Alto de la imagen a redimensionar',
    example: 300,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El alto debe ser un número' })
  height?: number;
}