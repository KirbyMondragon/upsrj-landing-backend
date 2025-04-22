import { Authentication, Images, Permission, Puck } from './../interfaces/valid-permissions';
import { SetMetadata } from '@nestjs/common';


export const META_PERMISSIONS = 'permissions';

export const PermissionProtected = (permissions: (Authentication| Images| Permission| Puck )[]) => { 
    return function (target: object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
        SetMetadata(META_PERMISSIONS, permissions)(target, key, descriptor);
    };
};