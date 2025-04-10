import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { PuckComponent } from './entities/puck-component.entity';
import { CreatePuckComponentDto } from './dto/create-puck-component.dto';
import { UpdatePuckComponentDto } from './dto/update-puck-component.dto';
import { ObjectId } from 'mongodb';
import { PaginationDto } from '../common/dtos/pagination.dto';

@Injectable()
export class PuckComponentsService {
  constructor(
    @InjectRepository(PuckComponent)
    private readonly puckRepository: MongoRepository<PuckComponent>,
  ) {}

  /**
   * Creates a new Puck component
   * @param dto The data transfer object containing component details
   * @returns The newly created component
   */
  async create(dto: CreatePuckComponentDto){
    const newComponent = this.puckRepository.create(dto);
    return await this.puckRepository.save(newComponent);
  }

  /**
   * Retrieves all Puck components with pagination
   * @param paginationDto Optional pagination parameters (limit, offset)
   * @returns Array of Puck components based on pagination settings
   */
  async findAll(paginationDto?: PaginationDto){
    const { limit = 10, offset = 0 } = paginationDto || {};

    return await this.puckRepository.find({
      take: limit,
      skip: offset
    });
  }

  /**
   * Finds a specific Puck component by ID
   * @param id The unique identifier of the component
   * @returns The found component or throws NotFoundException
   */
  async findOne(id: string){
    const component = await this.puckRepository.findOneBy({ id: new ObjectId(id) });
    if (!component) {
      throw new NotFoundException(`Component with id "${id}" not found`);
    }
    return component;
  }

  /**
   * Updates an existing Puck component
   * @param id The unique identifier of the component to update
   * @param dto The data transfer object with updated fields
   * @returns The updated component
   */
  async update(id: string, dto: UpdatePuckComponentDto){
    const existing = await this.findOne(id); // lanza error si no existe
    const updated = Object.assign(existing, dto);
    return await this.puckRepository.save(updated);
  }

  /**
   * Removes a Puck component from the database
   * @param id The unique identifier of the component to delete
   */
  async remove(id: string) {
    const component = await this.findOne(id); // lanza error si no existe
        await this.puckRepository.remove(component);
  }
}
