import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLE } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector:Reflector
  ){

  }
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: string[] = this.reflector.get(META_ROLE, context.getHandler())
    
    if (!validRoles) return true;
    if (validRoles.length === 0) return true;
    
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if(!user){
      throw new BadRequestException('user not found')
    }
    for (const role of user.roles){
      if (validRoles.includes(role)){
        return true;
      }
    }
    throw new ForbiddenException(
      `User ${user.fulName} need a valid role [${validRoles}]`
    )

    console.log({userRoles:user.roles})
    return true;
  }
}
