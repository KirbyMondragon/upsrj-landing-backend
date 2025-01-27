import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('access_rights')
export class AccessRight {
    @ObjectIdColumn()
    @ApiProperty({ description: 'Unique identifier for the access right', type: 'string', format: 'ObjectId' })
    _id: ObjectId;

    @Column('objectId')
    @ApiProperty({ description: 'Module ID associated with the access right', type: 'string', format: 'ObjectId' })
    moduleId: ObjectId;

    @Column({ default: false })
    @ApiProperty({ description: 'Permission to create resources', default: false })
    canCreate: boolean;

    @Column({ default: false })
    @ApiProperty({ description: 'Permission to read resources', default: false })
    canRead: boolean;

    @Column({ default: false })
    @ApiProperty({ description: 'Permission to update resources', default: false })
    canUpdate: boolean;

    @Column({ default: false })
    @ApiProperty({ description: 'Permission to delete resources', default: false })
    canDelete: boolean;

    @Column('objectId')
    @ApiProperty({ description: 'User ID associated with the access right', type: 'string', format: 'ObjectId' })
    userId: ObjectId;
}
