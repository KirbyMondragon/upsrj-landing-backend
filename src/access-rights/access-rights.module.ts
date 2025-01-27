import { Module } from '@nestjs/common';
import { AccessRightsService } from './access-rights.service';
import { AccessRightsController } from './access-rights.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRight } from './entities/access-right.entity';
import { SystemModule } from './entities/system-module.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([AccessRight,SystemModule])
  ],
  controllers: [AccessRightsController],
  providers: [AccessRightsService],
  exports:[TypeOrmModule, AccessRightsService]
})
export class AccessRightsModule {}
