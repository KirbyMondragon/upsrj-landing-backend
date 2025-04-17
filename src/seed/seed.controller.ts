import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SeedService } from './seed.service';
import { initialData } from './data/seed-data';
import { ApiResponse } from '@nestjs/swagger';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}


  @ApiResponse({ status: 201, description: 'Modules created successfully.'})
  @ApiResponse({ status: 200, description: 'The modules already exist in the database.' })
  @ApiResponse({ status: 400, description: 'The password is wrong' })
  @Get(':password')
  // Ejecutar el seed con la contraseña proporcionada
  executeSeed(@Param('password') password: string) {
    return this.seedService.executeSeed(password);
  }

}
