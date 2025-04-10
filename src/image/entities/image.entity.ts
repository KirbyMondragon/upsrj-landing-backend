import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

/**
 * Entidad que representa una imagen en la base de datos
 * 
 * Almacena los metadatos de las imágenes que se guardan en GridFS
 * La imagen física se almacena en GridFS, mientras que esta entidad
 * mantiene la relación entre el UUID de acceso público y el ID de GridFS
 */
@Entity('images')
export class Image {
  /**
   * ID interno de MongoDB (ObjectId)
   */
  @ObjectIdColumn()
  _id: ObjectId;

  /**
   * UUID único para identificar la imagen públicamente
   * Este es el ID que se usa en las URLs para acceder a la imagen
   */
  @Column()
  uuid: string;

  /**
   * URL relativa para acceder a la imagen
   * Ejemplo: /images/123e4567-e89b-12d3-a456-426614174000
   */
  @Column()
  image: string;

  /**
   * ID del archivo en GridFS
   * Se utiliza para recuperar el archivo físico de la imagen desde GridFS
   */
  @Column()
  gridFsId: ObjectId;

  /**
   * Indica si la imagen está activa o ha sido "eliminada"
   * Las imágenes no se eliminan físicamente, solo se marcan como inactivas
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Fecha de creación de la imagen
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}