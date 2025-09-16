import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { UpdateTemplatesModuleDto } from './dto/update-templates-module.dto';
import { ObjectId } from 'mongodb';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { TemplatesComponent } from './entities/templates-module.entity';
import { CreateTemplatesModuleDto } from './dto/create-templates-module.dto';

@Injectable()
export class TemplatesModuleService {
  constructor(
    @InjectRepository(TemplatesComponent)
    private readonly templatesRepository: MongoRepository<TemplatesComponent>,
  ) {}

  /**
   * Creates a new Templates Module
   * @param dto The data transfer object containing module details
   * @returns The newly created module
   */
  async create(dto: CreateTemplatesModuleDto): Promise<TemplatesComponent> {
    const { _id, ...restDto } = dto as any;

    // If _id exists, try to update instead of creating new
    if (_id) {
      const exists = await this.templatesRepository.findOneBy({
        _id: new ObjectId(_id),
      });

      if (exists) {
        // Update the existing record
        await this.templatesRepository.update(
          { _id: new ObjectId(_id) },
          { ...restDto },
        );

        return this.templatesRepository.findOneBy({ _id: new ObjectId(_id) });
      }
    }

    return this.templatesRepository.save({
      ...restDto,
    });
  }

  /**
   * Retrieves all Templates Modules with pagination
   * @param paginationDto Optional pagination parameters (limit, offset)
   * @returns Array of Puck components based on pagination settings
   */
  async findAll(paginationDto?: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto || {};

    return await this.templatesRepository.find({
      take: limit,
      skip: offset,
    });
  }

  /**
   * Finds a specific Puck component by ID
   * @param id The unique identifier of the component
   * @returns The found component or throws NotFoundException
   */
  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
    const component = await this.templatesRepository.findOneBy({
      _id: objectId,
    });
    if (!component) {
      throw new NotFoundException(`Component with id "${id}" not found`);
    }
    return component;
  }

  /**
   * Updates an existing Puck component
   * @param slug The unique identifier of the component to update
   * @param dto The data transfer object with updated fields
   * @returns The updated component
   */
  async update(id: string, dto: UpdateTemplatesModuleDto) {
    const existing = await this.findOne(id); // lanza error si no existe
    const updated = Object.assign(existing, dto);
    return await this.templatesRepository.save(updated);
  }

  /**
   * Removes a Templates Module from the database
   * @param id The unique identifier of the module to delete
   */
  async remove(id: string) {
    const component = await this.findOne(id); // lanza error si no existe
    await this.templatesRepository.remove(component);
  }
}
