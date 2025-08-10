// src/videos/videos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GridFSBucket } from 'mongodb';

import { Video } from './entities/video.entity';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AccessRightsModule } from 'src/access-rights/access-rights.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),        // 👈 tu entidad
    AuthModule, AccessRightsModule,            // 👈 el módulo de autenticación y derechos de acceso
  ],
  providers: [
    VideosService,
    {
      provide: 'GRIDFS_BUCKET_VIDEOS',
      useFactory: (dataSource: DataSource) => {
        const db = (dataSource.driver as any).queryRunner
          .databaseConnection.db(dataSource.options.database);
        return new GridFSBucket(db, { bucketName: 'videos' });
      },
      inject: [DataSource],
    },
  ],
  controllers: [VideosController],
  exports: [VideosService],                   // 👈 no exportes el bucket
})
export class VideosModule {}
