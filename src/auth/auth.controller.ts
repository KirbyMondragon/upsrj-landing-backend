import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, SetMetadata, Query, ParseBoolPipe} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { GetUser } from './decorators/get-user.decorator';
import { Auth } from './decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Authentication, Permission  } from './interfaces';
@ApiTags('Auth')
@Controller('auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Get all users', description: 'Retrieves all users from the database.'})
  @ApiResponse({ status: 200, description: 'Users found successfully'})
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Auth([Authentication.canRead])
  @Get('getUsers')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.authService.findAll(paginationDto);
  }

  @ApiOperation({ summary: 'Create a new user', description: 'Creates a new user with the provided data.'})
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request. Duplicate entry' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('register')
  // Registro de un nuevo usuario
  async create(@Body() createUserDto: CreateUserDto) {
    // Cambiamos el tipo de retorno para que coincida con lo que realmente devuelve el servicio
    return this.authService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Login user', description: 'Logs in a user with the provided credentials.'})
  @ApiResponse({ status: 201, description: 'User logged in successfully'})
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('login')
  // Inicio de sesión de un usuario
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @ApiOperation({ summary: 'Update a user (email, password, matricula or fullName)', description: 'Updates a user with the provided data.'})
  @ApiParam({ name: 'id', required: true, description: 'Unique identifier of the user', example: '65d5c1ab2f4f4d3e9c'})
  @ApiResponse({ status: 200, description: 'Request successful. User was updated successfully', type: UpdateUserDto})
  @ApiResponse({ status: 400, description: 'Bad request due to invalid input'} )
  @ApiResponse({ status: 403, description: 'Forbidden. Token related issues'})
  @ApiResponse({ status: 404, description: ''})
  @ApiResponse({ status: 500, description: 'Internal server error'})
  @Auth([Authentication.canUpdate])
  @Patch('updateUser/:id')
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto:UpdateUserDto
  ){
    return this.authService.UpdateUsers(id , updateUserDto);
  }

  @ApiOperation({ summary: 'Toggle a user active status', description: 'Toggles the active status of a user by their unique ID.'})
  @ApiParam({ name: 'id', required: true, description: 'Unique identifier of the user', example: '65d5c1ab2f4f4d3e9c8b4567'})
  @ApiResponse({ status: 200, description: 'Request successful. User status toggled successfully'})
  @ApiResponse({ status: 400, description: 'Bad request due to invalid input' })
  @ApiResponse({ status: 404, description: 'User not found'})
  @Patch('toggle-active/:id')
  @Auth([Authentication.canUpdate])
  async toggleUserStatus(@Param('id') id: string) {
    return this.authService.toggleUserStatus(id);
  }

  //Prueba (Get user 'isActive' status)
  @ApiOperation({ summary: 'Testing endpoint', description: 'Checks the status of a user by their unique ID.'})
  @Get('status/:id')
  @Auth([Authentication.canRead, Permission.canRead])
  checkStatus(@Param('id') id: string){
    return this.authService.checkUserStatus(id)
  }

  //Prueba: Ruta privada con decorador personalizado Auth
  @ApiTags('Pruebas')              //
  @ApiResponse({ status: 200, description: 'Acceso concedido' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o ausente' })
  @Get('private')
  @Auth([Authentication.canRead, Permission.canRead])
  testingPrivateRoute3(
    @GetUser() user: User
  ){
    return {
      ok: true,
      message: 'This is a private route',
      user
    }
  }
}