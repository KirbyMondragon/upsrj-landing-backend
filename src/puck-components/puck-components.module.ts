import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuckComponent } from './entities/puck-component.entity';
import { PuckComponentsService } from './puck-components.service';
import { PuckComponentsController } from './puck-components.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PuckComponent])],
  providers: [PuckComponentsService],
  controllers: [PuckComponentsController],
})
export class PuckComponentsModule {}
