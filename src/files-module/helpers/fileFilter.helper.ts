import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file) {
    return cb(new BadRequestException('Archivo vacío'), false);
  }

  const isPdf = file.mimetype === 'application/pdf';

  if (!isPdf) {
    return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
  }

  return cb(null, true);
};
