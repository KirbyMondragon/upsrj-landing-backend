// src/files/files.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GridFSBucket } from 'mongodb';

import { FilesModuleService } from './files-module.service';
import { FilesModuleController } from './files-module.controller';
import { Files } from './entities/files-module.entity';
import { AuthModule } from 'src/auth/auth.module';
import { AccessRightsModule } from 'src/access-rights/access-rights.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Files]),
    AuthModule,
    AccessRightsModule,
  ],
  controllers: [FilesModuleController],
  providers: [
    FilesModuleService,
    {
      provide: 'FILES_GRIDFS_BUCKET',
      useFactory: (dataSource: DataSource) => {
        const db = (dataSource.driver as any).queryRunner
          .databaseConnection.db(dataSource.options.database);
        return new GridFSBucket(db, { bucketName: 'files' });
      },
      inject: [DataSource],
    },
  ],
  exports: [FilesModuleService],
})
export class FilesModule {}
