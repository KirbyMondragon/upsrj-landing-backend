// Configuración para mocks de Jest
jest.mock('src/auth/entities/user.entity', () => {
  const { ObjectId } = require('mongodb');
  
  // Clase User mock
  class User {
    constructor() {
      this.id = new ObjectId();
      this.email = 'test@example.com';
      this.password = 'password';
      this.fullName = 'Test User';
      this.matricula = '12345678';
      this.isActive = true;
      this.accessRights = [];
    }
    
    checkFieldsInsert() { /* mock implementation */ }
    checkFieldsBeforeUpdate() { /* mock implementation */ }
  }
  
  return { User };
}, { virtual: true });
