import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AccessRightsModule } from 'src/access-rights/access-rights.module';

@Module({
  controllers: [AuthController],
  imports:[
    ConfigModule,
    AccessRightsModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({defaultStrategy: 'jwt'}),

    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(configService:ConfigService) => {
        console.log(`Secret Jwt: ${configService.get('JWT_SECRET')}`)
        console.log(`Secret Jwt: ${process.env.JWT_SECRET}`)
        return{
          secret: configService.get('JWT_SECRET'),
          signOptions:{
            expiresIn:'2h'
          }
        }
      }
    })
  ],
  providers: [AuthService , JwtStrategy],
  exports:[TypeOrmModule, JwtStrategy, PassportModule, JwtModule ]
})
export class AuthModule {}
