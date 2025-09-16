import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { Auth } from 'src/auth/decorators';
import { TemplatesModuleService } from './templates-module.service';
import { CreateTemplatesModuleDto } from './dto/create-templates-module.dto';
import { UpdateTemplatesModuleDto } from './dto/update-templates-module.dto';
import { TemplatesComponent } from './entities/templates-module.entity';

@ApiTags('Templates')
@ApiBearerAuth('JWT-auth')
@Controller('Templates')
export class TemplatesModuleController {
  constructor(private readonly templatesService: TemplatesModuleService) {}

  @ApiOperation({ summary: 'Crear un nuevo template' })
  @ApiResponse({
    status: 201,
    description: 'Template creado exitosamente',
    type: TemplatesComponent,
  })
  @ApiResponse({ status: 400, description: 'Solicitud inválida' })
  @Auth([{ module: 'Templates', permission: 'canCreate' }])
  @Post()
  async create(
    @Body() createDto: CreateTemplatesModuleDto,
  ): Promise<TemplatesComponent> {
    return this.templatesService.create(createDto);
  }

  @ApiOperation({ summary: 'Obtener todos los templates' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los templates',
    type: [TemplatesComponent],
  })
  @ApiResponse({ status: 500, description: 'Error en el servidor' })
  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<TemplatesComponent[]> {
    return this.templatesService.findAll(paginationDto);
  }

  @ApiOperation({ summary: 'Obtener un template por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Template encontrado',
    type: TemplatesComponent,
  })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TemplatesComponent> {
    return this.templatesService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar un template existente' })
  @ApiResponse({
    status: 200,
    description: 'Template actualizado',
    type: TemplatesComponent,
  })
  @ApiResponse({ status: 400, description: 'Datos de actualización inválidos' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  @Auth([{ module: 'Templates', permission: 'canUpdate' }])
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplatesModuleDto,
  ): Promise<TemplatesComponent> {
    // const slugString = decodeURIComponent(slug);
    return this.templatesService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Eliminar un template por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Template eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  @Auth([{ module: 'Templates', permission: 'canDelete' }])
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    // const slugString = decodeURIComponent(slug);
    return this.templatesService.remove(id);
  }
}
