import { ObjectId } from 'mongodb';

// Mock de la entidad User para pruebas
export class User {
  id: ObjectId;
  email: string;
  password: string;
  fullName: string;
  matricula: string;
  isActive: boolean;
  accessRights: ObjectId[];

  checkFieldsInsert() {
    // Mock implementation
  }

  checkFieldsBeforeUpdate() {
    // Mock implementation
  }
}
