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

    // Si _id viene pero no es válido, lanzar error
    if (_id && (typeof _id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(_id))) {
      throw new BadRequestException('El _id debe ser un ObjectId válido (24 hex)');
    }

    // Solo intentar update si _id es un ObjectId válido
    if (_id && typeof _id === 'string' && /^[a-fA-F0-9]{24}$/.test(_id)) {
      const objectId = new ObjectId(_id);
      const exists = await this.templatesRepository.findOneBy({ _id: objectId });
      if (exists) {
        await this.templatesRepository.update(
          { _id: objectId },
          { ...restDto },
        );
        return this.templatesRepository.findOneBy({ _id: objectId });
      }
    }

    // Si no hay _id válido, crear nuevo
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
    if (!id || typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    objectId = new ObjectId(id);
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
