import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { PuckComponentsService } from './puck-components.service';
import { CreatePuckComponentDto } from './dto/create-puck-component.dto';
import { UpdatePuckComponentDto } from './dto/update-puck-component.dto';
import { PuckComponent } from './entities/puck-component.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../common/dtos/pagination.dto';

@ApiTags('Puck Components')
@Controller('puck-components')
export class PuckComponentsController {
    constructor(private readonly puckComponentsService: PuckComponentsService) {}

    @ApiOperation({ summary: 'Crear un nuevo componente' })
    @ApiResponse({ status: 201, description: 'Componente creado exitosamente', type: PuckComponent })
    @ApiResponse({ status: 400, description: 'Solicitud inválida' })
    @Post()
    async create(@Body() createPuckComponentDto: CreatePuckComponentDto): Promise<PuckComponent> {
        return this.puckComponentsService.create(createPuckComponentDto);
    }

    @ApiOperation({ summary: 'Obtener todos los componentes' })
    @ApiResponse({ status: 200, description: 'Lista de todos los componentes', type: [PuckComponent] })
    @ApiResponse({ status: 500, description: 'Error en el servidor' })
    @Get()
    async findAll(@Query() paginationDto: PaginationDto): Promise<PuckComponent[]> {
        return this.puckComponentsService.findAll(paginationDto);
    }

    @ApiOperation({ summary: 'Obtener un componente por su ID' })
    @ApiResponse({ status: 200, description: 'Componente encontrado', type: PuckComponent })
    @ApiResponse({ status: 404, description: 'Componente no encontrado' })
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<PuckComponent> {
        return this.puckComponentsService.findOne(id);
    }

    @ApiOperation({ summary: 'Actualizar un componente existente' })
    @ApiResponse({ status: 200, description: 'Componente actualizado', type: PuckComponent })
    @ApiResponse({ status: 400, description: 'Datos de actualización inválidos' })
    @ApiResponse({ status: 404, description: 'Componente no encontrado' })
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updatePuckComponentDto: UpdatePuckComponentDto,
    ): Promise<PuckComponent> {
        return this.puckComponentsService.update(id, updatePuckComponentDto);
    }

    @ApiOperation({ summary: 'Eliminar un componente por su ID' })
    @ApiResponse({ status: 200, description: 'Componente eliminado exitosamente' })
    @ApiResponse({ status: 404, description: 'Componente no encontrado' })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.puckComponentsService.remove(id);
    }
}
