import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AccessRightsModule } from './access-rights/access-rights.module';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';
import { PuckComponentsModule } from './puck-components/puck-components.module';
import { ImageModule } from './image/image.module';
import { FilesModule } from './files-module/files-module.module';

@Module({
  providers: [SeedService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Permite acceso a las variables de entorno en toda la app
    }),

    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.DATABASE_URL || `mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.1`,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    AuthModule,
    SeedModule,
    AccessRightsModule,
    PuckComponentsModule,
    ImageModule,
    FilesModule,
  ]
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedService: SeedService) {}

  async onModuleInit() {
    await this.seedService.executeSeed(process.env.PASSWORD_SEED);
  }
}
