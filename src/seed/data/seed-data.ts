import { ObjectId } from 'mongodb';
import { SystemModule } from 'src/access-rights/entities/system-module.entity';
import { CreateUserDto } from 'src/auth/dto';
import { config } from 'dotenv';
config(); // carga variables desde .env si no se han cargado

// Datos iniciales para la base de datos
export const initialData: Partial<SystemModule>[] = [
  { moduleName: 'Authentication', isActive: true },
  { moduleName: 'Permission', isActive: true },
  { moduleName: 'Images', isActive: true },
  { moduleName: 'Puck', isActive: true },
  { moduleName: 'Videos', isActive: true },
  { moduleName: 'Files', isActive: true },
  { moduleName: 'Blog', isActive: true },
  { moduleName: 'Templates', isActive: true },
];

export const initialUsers: CreateUserDto[] = [
  {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: process.env.ADMIN_NAME,
    matricula: process.env.ADMIN_MATRICULA,
  },
];
