import { Controller, Get, Post, Body, Param} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { GetUser } from './decorators/get-user.decorator';
import { ApiResponse } from '@nestjs/swagger';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 201, description: 'User was created successfully', type: CreateUserDto})
  @ApiResponse({ status: 400, description: 'Bad request due to invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden. Token related issues' })
  @Post('register')
  createUser(@Body() createUserDto:CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @ApiResponse({ status: 201, description: 'User logged in', type: LoginUserDto})
  @ApiResponse({ status: 400, description: 'Bad request due to invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden. Token related issues' })
  @Post('login')
  loginUser(@Body() loginUserDto:LoginUserDto) {
    return this.authService.login(loginUserDto);
  }


}
