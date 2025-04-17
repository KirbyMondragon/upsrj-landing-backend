import { forwardRef, Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AccessRightsModule } from 'src/access-rights/access-rights.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports:[
    ConfigModule,
    AccessRightsModule,
    forwardRef(() => AuthModule),  
  ]
})
// Módulo que gestiona la inicialización de datos en la base de datos
export class SeedModule {}
