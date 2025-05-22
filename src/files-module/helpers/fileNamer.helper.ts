import { v4 as uuid } from 'uuid';

export const fileNamer = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) return callback(new Error('Archivo vacío'), false);

  const fileName = `${uuid()}.pdf`; // siempre PDF
  callback(null, fileName);
};
