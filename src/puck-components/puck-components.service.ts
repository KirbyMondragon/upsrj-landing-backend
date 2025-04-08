import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { PuckComponent } from './entities/puck-component.entity';
import { CreatePuckComponentDto } from './dto/create-puck-component.dto';
import { UpdatePuckComponentDto } from './dto/update-puck-component.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class PuckComponentsService {
  constructor(
    @InjectRepository(PuckComponent)
    private readonly puckRepository: MongoRepository<PuckComponent>,
  ) {}

  async create(dto: CreatePuckComponentDto){
    const newComponent = this.puckRepository.create(dto);
    return await this.puckRepository.save(newComponent);
  }

  async findAll(){
    return await this.puckRepository.find();
  }

  async findOne(id: string){
    const component = await this.puckRepository.findOneBy({ id: new ObjectId(id) });
    if (!component) {
      throw new NotFoundException(`Component with id "${id}" not found`);
    }
    return component;
  }

  async update(id: string, dto: UpdatePuckComponentDto){
    const existing = await this.findOne(id); // lanza error si no existe
    const updated = Object.assign(existing, dto);
    return await this.puckRepository.save(updated);
  }

  async remove(id: string) {
    const component = await this.findOne(id); // lanza error si no existe
        await this.puckRepository.remove(component);
  }
}
