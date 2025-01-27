import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccessRightsService } from './access-rights.service';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { UpdateAccessRightDto } from './dto/update-access-right.dto';

@Controller('access-rights')
export class AccessRightsController {
  constructor(private readonly accessRightsService: AccessRightsService) {}

  @Post()
  create(@Body() createAccessRightDto: CreateAccessRightDto) {
    return this.accessRightsService.create(createAccessRightDto);
  }

  @Get()
  findAll() {
    return this.accessRightsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessRightsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccessRightDto: UpdateAccessRightDto) {
    return this.accessRightsService.update(+id, updateAccessRightDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessRightsService.remove(+id);
  }
}
