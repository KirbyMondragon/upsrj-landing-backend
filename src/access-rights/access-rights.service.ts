import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';

import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/user.entity';
import { UpdateAccessRightDto } from './dto/update-access-right.dto';
import { AccessRight } from './entities/access-right.entity';
import { SystemModule } from './entities/system-module.entity';

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */
interface PermissionFlags {
  canCreate: boolean;
  canRead:   boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               AccessRightsSvc                              */
/* -------------------------------------------------------------------------- */
@Injectable()
export class AccessRightsService {
  /* --------------------------------- DI ---------------------------------- */
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    @InjectRepository(AccessRight)
    private readonly accessRightRepo: Repository<AccessRight>,

    @InjectRepository(SystemModule)
    private readonly systemModuleRepo: Repository<SystemModule>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /* ---------------------------------------------------------------------- */
  /*                             Query helpers                              */
  /* ---------------------------------------------------------------------- */

  /** Devuelve el `ObjectId` del usuario o arroja la excepción adecuada. */
  private async resolveUserId(userIdOrMatricula: string): Promise<ObjectId> {
    const query = ObjectId.isValid(userIdOrMatricula)
      ? { _id: new ObjectId(userIdOrMatricula) }
      : { matricula: userIdOrMatricula };

    const user = await this.userRepo.findOne({ where: query });
    if (!user) throw new NotFoundException('User not found');

    return user.id as unknown as ObjectId;
  }

  /** Devuelve el módulo o lanza excepción. */
  private async getModuleByName(moduleName: string): Promise<SystemModule> {
    const module = await this.systemModuleRepo.findOne({
      where: { moduleName },
    });
    if (!module) throw new BadRequestException(`Module ${moduleName} not found`);
    return module;
  }

  /* ---------------------------------------------------------------------- */
  /*                         Permissions CRUD helpers                       */
  /* ---------------------------------------------------------------------- */

  /**
   * Construye y guarda permisos usando los `flags` indicados.
   * Reutilizada por `createPermissionSeed` y `createPermission`.
   */
  private async createPermissions(
    user: User,
    flags: PermissionFlags,
  ): Promise<AccessRight[]> {
    const modules = await this.systemModuleRepo.find();

    const permissions = modules.map((m) =>
      this.accessRightRepo.create({
        userId:     user.id as ObjectId,
        moduleId:   m._id, // ObjectId en tu entidad
        moduleName: m.moduleName,
        ...flags,
      }),
    );

    return this.accessRightRepo.save(permissions);
  }

  /* ---------------------------------------------------------------------- */
  /*                              Public API                                */
  /* ---------------------------------------------------------------------- */

  /* ------------------------------ READ ----------------------------------- */

  async findOne(id: string, moduleName: string) {
    const userId = await this.resolveUserId(id);
    await this.getModuleByName(moduleName);

    const perm = await this.accessRightRepo.findOne({
      where: { userId, moduleName },
    });
    if (!perm) throw new NotFoundException('Permissions not found');
    return perm;
  }

  async findAll(id: string) {
    const userId = await this.resolveUserId(id);

    const perms = await this.accessRightRepo.find({ where: { userId } });
    if (!perms.length) throw new NotFoundException('Permissions not found');
    return perms;
  }

  /* ----------------------------- UPDATE ---------------------------------- */

  async update(
    id: string,
    moduleName: string,
    dto: UpdateAccessRightDto,
  ): Promise<AccessRight[]> {
    const userId = await this.resolveUserId(id);
    await this.authService.checkUserStatus(userId.toString());
    await this.getModuleByName(moduleName);

    const perms = await this.accessRightRepo.find({
      where: { userId, moduleName },
    });
    if (!perms.length)
      throw new NotFoundException(
        `Permissions not found for user ${userId} in module ${moduleName}`,
      );

    const updated = perms.map((p) => this.accessRightRepo.merge(p, dto));
    return this.accessRightRepo.save(updated);
  }

  /* --------------------------- SOFT‑DELETE ------------------------------- */

  async remove(id: string): Promise<AccessRight[]> {
    const userId = await this.resolveUserId(id);
    await this.authService.checkUserStatus(userId.toString());

    const perms = await this.accessRightRepo.find({ where: { userId } });
    if (!perms.length) throw new NotFoundException('Permissions not found');

    perms.forEach((p) =>
      Object.assign(p, {
        canCreate: false,
        canRead:   false,
        canUpdate: false,
        canDelete: false,
      }),
    );
    return this.accessRightRepo.save(perms);
  }

  /* ------------------------ PERMISSION SEEDS ----------------------------- */

  /** Permisos completos (superadmin/seed). */
  async createPermissionSeed(user: User): Promise<AccessRight[]> {
    return this.createPermissions(user, {
      canCreate: true,
      canRead:   true,
      canUpdate: true,
      canDelete: true,
    });
  }

  /** Permisos iniciales vacíos (usuario estándar). */
  async createPermission(user: User): Promise<AccessRight[]> {
    return this.createPermissions(user, {
      canCreate: false,
      canRead:   false,
      canUpdate: false,
      canDelete: false,
    });
  }

  /* ------------------------- EXTRA HELPERS ------------------------------- */

  async getPermissionsByUserId(userId: string): Promise<AccessRight[]> {
    return this.accessRightRepo.find({
      where: { userId: new ObjectId(userId) },
    });
  }
}
