// src/images/entities/image.entity.ts
import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

/**
 * Metadatos de cada imagen almacenada en GridFS.
 * Solo guardamos la referencia (`gridFsId`) y datos útiles para filtrar
 * o auditar.  La imagen binaria vive en el bucket.
 */
@Entity('files')
export class Files {
  /** ID propio del documento de metadatos. */
  @ObjectIdColumn()
  id: ObjectId;

  /** Nombre original (o UUID) del archivo subido. */
  @Column()
  filename: string;

  /** ID interno que devuelve GridFS al almacenar el archivo. */
  @Column()
  gridFsId: ObjectId;

  /** MIME type (image/png, image/jpeg, image/webp, …). */
  @Column()
  contentType: string;

  /** Fecha de alta: generada automáticamente por TypeORM. */
  @CreateDateColumn()
  createdAt: Date;
}
