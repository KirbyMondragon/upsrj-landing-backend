import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('system_modules')
export class SystemModule {
    @ObjectIdColumn()
    @ApiProperty({ description: 'Unique identifier for the system module', type: 'string', format: 'ObjectId' })
    _id: ObjectId;

    @Column()
    @ApiProperty({ description: 'Module name' })
    moduleName: string;

    @Column({ default: true })
    @ApiProperty({ description: 'Active status of the module', default: true })
    isActive: boolean;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    @ApiProperty({ description: 'Timestamp when the module was created', type: 'string', format: 'date-time' })
    createdAt: Date;

    @Column({ nullable: true })
    @ApiProperty({ description: 'Timestamp when the module was last updated', type: 'string', format: 'date-time' })
    updatedAt?: Date;
}
