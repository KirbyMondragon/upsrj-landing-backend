
import { ObjectId } from 'mongodb';
import { SystemModule } from 'src/access-rights/entities/system-module.entity';

export const initialData: Partial<SystemModule>[] = [
    { _id: new ObjectId(), moduleName: 'Authentication', isActive: true },
    { _id: new ObjectId(), moduleName: 'Permission', isActive: true },
];
