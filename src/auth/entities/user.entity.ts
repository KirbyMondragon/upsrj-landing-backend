import { ApiProperty } from '@nestjs/swagger';
import { Entity, ObjectIdColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity({ name: 'users' })
export class User {

    @ApiProperty({
        description: 'Identificador único del usuario',
        type: String,
    })
    @ObjectIdColumn()
    id: ObjectId;

    //* Mail de los usuarios
    @ApiProperty({
        description: 'Correo del usuario',
        type: String,
    })
    @Column({
        unique: true
    })
    email: string;

    //* Password
    @ApiProperty({
        description: 'Contraseña de los usuarios',
        type: String,
    })
    @Column({
        select: false
    })
    password: string;

    //* FullName
    @ApiProperty({
        description: 'Nombre completo de los usuarios',
        type: String,
    })
    @Column()
    fullName: string;

     //* FullName
     @ApiProperty({
        description: 'Matricula de los usuarios',
        type: String,
    })
    @Column()
    matricula: string;

    //* IsActive
    @ApiProperty({
        description: 'Los usuarios no se eliminan, solo se dan de baja con un boolean',
        type: Boolean,
    })
    @Column({
        default: true
    })
    isActive: boolean;


    @ApiProperty({ description: 'List of access right IDs', type: 'array', items: { type: 'string', format: 'ObjectId' } })
    @Column()
    accessRights: ObjectId[];

    @BeforeInsert()
    checkFieldsInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.email = this.email.toLowerCase().trim();
    }
}
