import { Entity, Column, ObjectIdColumn, CreateDateColumn, ObjectId } from 'typeorm';

@Entity('videos')
export class Video {
    @ObjectIdColumn()
    _id: ObjectId;

    @Column('objectid')
    gridFsId: ObjectId;

    @Column()
    filename: string;

    @Column()
    contentType: string;

    @Column({ type: 'int', comment: 'Duración en segundos' })
    duration: number;

    @Column({ type: 'int' })
    width: number;

    @Column({ type: 'int' })
    height: number;

    @Column({ unique: true })
    hash: string; // Nuevo campo para almacenar el hash único del video

    @CreateDateColumn()
    createdAt: Date;
}