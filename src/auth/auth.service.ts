import { 
  BadRequestException, 
  Injectable, 
  InternalServerErrorException, 
  UnauthorizedException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';  
import { MongoRepository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt.payload.interface';
import { AccessRightsService } from '../access-rights/access-rights.service';

@Injectable()
export class AuthService {
  constructor( 
    @InjectRepository(User)
    private readonly userRepository: MongoRepository<User>,  // Cambio a MongoRepository para compatibilidad con MongoDB
    private readonly accessRightsService:AccessRightsService, 
    private readonly jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
  
      // Hash de la contraseña usando bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Crear la instancia del usuario con valores predeterminados para propiedades ausentes en el DTO
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        isActive: true,  // Se establece el valor predeterminado manualmente
      });
  
      // Guardar el usuario en la base de datos
      const newUser =  await this.userRepository.save(user);
      
      await this.accessRightsService.createPermission(user);
      // Eliminar datos sensibles antes de retornar
      delete newUser.password;
  
      return {
        ...newUser,
        token: this.getJwtToken({ id: newUser.id.toString() }),  // Convertir ObjectId a string
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }
  

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id.toString() })  // Convierte ObjectId a string
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const mailLowerCase = email.toLowerCase().trim();
    
    // Buscar el usuario y seleccionar solo el correo y la contraseña
    const user = await this.userRepository.findOne({
        where: { email: mailLowerCase },
        select: { email: true, password: true, id: true },
    });
    
    // Verificar si el usuario existe
    if (!user) {
        throw new UnauthorizedException(`Credenciales incorrectas`);
    }
    
    // Comparar la contraseña proporcionada con la almacenada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
        throw new UnauthorizedException(`Credenciales incorrectas`);
    }
    
    // Opcional: eliminar la contraseña del objeto usuario antes de retornarlo
    delete user.password;
    
    return {
      ...user,
      token: this.getJwtToken({ id: user.id.toString() })  // Convierte ObjectId a string
    };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  private handleDBErrors(error: any): never {
    if (error.code === 11000) {  // MongoDB duplicate key error code
      throw new BadRequestException('Duplicate entry detected');
    }

    console.error(error);
    throw new InternalServerErrorException('Please check server logs');
  }
}
