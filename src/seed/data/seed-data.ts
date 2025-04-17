import { ObjectId } from 'mongodb';
import { SystemModule } from 'src/access-rights/entities/system-module.entity';
import { CreateUserDto } from 'src/auth/dto';
import { User } from 'src/auth/entities/user.entity';

// Datos iniciales para la base de datos
export const initialData: Partial<SystemModule>[] = [
    {  moduleName: 'Authentication', isActive: true },
    {  moduleName: 'Permission', isActive: true },
];

export const initialUsers:CreateUserDto[] = [
    {
        email: '022000816@upsrj.edu.mx',
        password: 'Abc123',        // Mayúscula, minúscula y número; 6 + caracteres
        fullName: 'Andrea Lopez',
        matricula: '022000816',    // 9 caracteres exactamente
      },
      {
        email: '021001076@upsrj.edu.mx',
        password: 'Abc123',        // Mayúscula, minúscula y número; 6 + caracteres
        fullName: 'RICARDO FEREGRINO OCHOA',
        matricula: '021001076',    // 9 caracteres exactamente
      },
      {
        email: '021000615@upsrj.edu.mx',
        password: 'Abc123',        // Mayúscula, minúscula y número; 6 + caracteres
        fullName: 'KEVIN ARTURO MONDRAGON TAPIA',
        matricula: '021000615',    // 9 caracteres exactamente
      }
];

