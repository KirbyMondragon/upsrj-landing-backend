import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { AccessRightsService } from './access-rights.service';
import { UpdateAccessRightDto } from './dto/update-access-right.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators';
import { Permission } from 'src/auth/interfaces';


// Controlador que maneja las solicitudes HTTP relacionadas con los derechos de acceso
@Controller('access-rights')
@ApiBearerAuth('JWT-auth')
export class AccessRightsController {
  constructor(private readonly accessRightsService: AccessRightsService) {}

  @ApiOperation({ summary: 'Find permissions per module per user', description: 'Retrieves the permissions for a user in a specific module.'})
  @ApiParam({ name: 'userId', required: true, description: 'Unique identifier of the user', example: '65d5c1ab2f4f4d3e9c8b4567'})
  @ApiQuery({ name: 'module', required: true, description: 'Name of the module', example: 'Authentication'})
  @ApiResponse({ status: 200, description: 'Request successful'})
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data (moduleName)'})
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data (userId)'})
  @ApiResponse({ status: 404, description: 'Permission not found'})
  //@Auth([Permission.canRead])
  @Get('getPermission/:userId')
  findOne(@Param('userId') UserId: string, @Query('module') moduleName: string) {
    return this.accessRightsService.findOne(UserId, moduleName);
  }

  @ApiOperation({ summary: 'Find all permissions per user', description: 'Retrieves the permissions for a user in all modules.'})
  @ApiParam({ name: 'userId', required: true, description: 'Unique identifier of the user', example: '65d5c1ab2f4f4d3e9c8b4567'})
  @ApiResponse({ status: 200, description: 'Request successful'})
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data (userId)'})
  @ApiResponse({ status: 404, description: 'Permissions not found'})
  //@Auth([Permission.canRead])
  @Get('getPermissions/:userId')
  findAll(@Param('userId') UserId: string) {
    return this.accessRightsService.findAll(UserId);
  }

  @ApiOperation({ summary: 'Update permissions per module per user', description: 'Updates the permissions for a user in a specific module.'})
  @ApiParam({ name: 'userId', required: true, description: 'Unique identifier of the user', example: '65d5c1ab2f4f4d3e9c8b4567'})
  @ApiQuery({ name: 'module', required: true, description: 'Name of the module', example: 'Authentication'})
  @ApiResponse({ status: 200, description: 'Permissions updated successfully'})
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data (moduleName)'})
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data (userId)'})
  @ApiResponse({ status: 404, description: 'User not found or inactive'})
  //@Auth([Permission.canUpdate])
  @Patch('updatePermissions/:userId')
  update(@Param('userId') UserId: string, @Query('module') moduleName: string, @Body() updateAccessRightDto: UpdateAccessRightDto) {
    return this.accessRightsService.update(UserId, moduleName, updateAccessRightDto);
  }

  @ApiOperation({ summary: 'Sets all permissions for a user to false', description: 'Soft deletes all the permissions for a user in all modules.'})
  @ApiParam({ name: 'userId', required: true, description: 'Unique identifier of the user', example: '65d5c1ab2f4f4d3e9c8b4567'})
  @ApiResponse({ status: 200, description: 'Permissions removed successfully'})
  @ApiResponse({ status: 400, description: 'Bad request. Invalid input data (userId)'})
  @ApiResponse({ status: 404, description: 'User not found or inactive'})
  //@Auth([Permission.canDelete])
  @Patch('removePermissions/:userId')
  remove(@Param('userId') UserId: string) {
    return this.accessRightsService.remove(UserId);
  }
}
