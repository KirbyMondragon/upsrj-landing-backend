import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSeedDto } from './dto/create-seed.dto';
import { UpdateSeedDto } from './dto/update-seed.dto';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { initialData } from './data/seed-data';
import { SystemModule } from 'src/access-rights/entities/system-module.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(SystemModule)
    private readonly systemModuleRepository: Repository<SystemModule>,
    private readonly configService: ConfigService
    
  ){}

  async executeSeed(password:string){
    //Obtenemos la contraseña del .env y si es igual , ejecutamos la creacion de los modulos
    const PASSWORD_SEED = this.configService.get<string>('PASSWORD_SEED');
    
    if(password === PASSWORD_SEED){
      const modules = initialData;
    
      const existingModules = await this.systemModuleRepository.find();
      
      if (existingModules.length === 0) {
     
        const createdModules = this.systemModuleRepository.create(modules);
        await this.systemModuleRepository.save(createdModules);
        return 'Modules created successfully.';
      } else {
        return 'The modules already exist in the database';
      }
    } else {
      throw new BadRequestException("The password is wrong")
    }
    
  }
  
}
