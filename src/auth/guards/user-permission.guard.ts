import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_PERMISSIONS } from '../decorators/permission-protected.decorator';
import { User } from '../entities/user.entity';
import { AccessRightsService } from 'src/access-rights/access-rights.service';
import { Authentication, Images, Permission, Puck } from './../interfaces/valid-permissions';


@Injectable()
export class UserPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessRightsService: AccessRightsService
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions: (Authentication| Images| Permission| Puck )[] = this.reflector.get(META_PERMISSIONS, context.getHandler()) || [];
  
    if (!requiredPermissions.length) return true;
  
    // Obtener el usuario desde el request
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;
  
    if (!user || !user.id) {
      throw new BadRequestException('User not found');
    }
  
    // Obtener permisos del usuario
    const userPermissions = await this.accessRightsService.getPermissionsByUserId(user.id.toString());
  
    // Verificar que el usuario tenga todos los permisos requeridos
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.some(userPerm => userPerm[permission] === true)
    );
  
    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `User ${user.fullName} does not have the required permissions (${requiredPermissions.join(', ')})`
      );
    }
    return true;
  }
}