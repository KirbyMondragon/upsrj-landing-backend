import { Injectable } from '@nestjs/common';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { UpdateAccessRightDto } from './dto/update-access-right.dto';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessRight } from './entities/access-right.entity';
import { Repository } from 'typeorm';
import { SystemModule } from './entities/system-module.entity';

@Injectable()
export class AccessRightsService {
  constructor(
    @InjectRepository(AccessRight)
    private readonly AccessRightRepository: Repository<AccessRight>,
    
    @InjectRepository(SystemModule)
    private readonly SystemModuleRepository: Repository<SystemModule>
  ){}
  create(createAccessRightDto: CreateAccessRightDto) {
    return 'This action adds a new accessRight';
  }

  findAll() {
    return `This action returns all accessRights`;
  }

  findOne(id: number) {
    return `This action returns a #${id} accessRight`;
  }

  update(id: number, updateAccessRightDto: UpdateAccessRightDto) {
    return `This action updates a #${id} accessRight`;
  }

  remove(id: number) {
    return `This action removes a #${id} accessRight`;
  }

  async createPermission(user: User): Promise<AccessRight[]> {
    // Obtener todos los módulos del sistema
    const modules = await this.SystemModuleRepository.find();

    // Crear los permisos asociando el `moduleId` en lugar del objeto completo del módulo
    const permissions = modules.map(module => {
        const permission = this.AccessRightRepository.create({
            userId: user.id,         // Guardamos solo el ID del usuario
            moduleId: module._id,     // Guardamos solo el ID del módulo
            canCreate: false,        // Inicializar permisos por defecto
            canRead: false,           // Solo lectura por defecto
            canUpdate: false,
            canDelete: false,
        });

        return permission;
    });

    // Guardar todos los permisos en la base de datos
    return this.AccessRightRepository.save(permissions);
}


}
