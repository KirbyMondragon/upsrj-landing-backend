import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { PuckComponentsService } from './puck-components.service';
import { PuckComponent } from './entities/puck-component.entity';
import { CreatePuckComponentDto } from './dto/create-puck-component.dto';
import { UpdatePuckComponentDto } from './dto/update-puck-component.dto';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

// Mock para PaginationDto en lugar de importarlo
class PaginationDto {
  limit?: number;
  offset?: number;
}

// Mock de los datos para pruebas
const mockPuckComponent = {
  id: new ObjectId('507f1f77bcf86cd799439011'),
  content: {
    type: 'section',
    props: {
      id: 'test-id',
      title: 'Test Title',
      description: 'Test Description'
    }
  },
  root: {
    props: {
      title: 'Root Title'
    }
  },
  zones: {
    main: [
      {
        type: 'component',
        props: {
          id: 'zone-component',
          title: 'Zone Title'
        }
      }
    ]
  }
};

const mockCreateDto: CreatePuckComponentDto = {
  content: {
    type: 'section',
    props: {
      id: 'test-id',
      title: 'Test Title',
      description: 'Test Description'
    }
  },
  root: {
    props: {
      title: 'Root Title'
    }
  },
  zones: {
    main: [
      {
        type: 'component',
        props: {
          id: 'zone-component',
          title: 'Zone Title'
        }
      }
    ]
  }
};

const mockUpdateDto: UpdatePuckComponentDto = {
  content: {
    type: 'section',
    props: {
      id: 'test-id',
      title: 'Updated Title',
      description: 'Updated Description'
    }
  }
};

// Mock del repositorio
const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

describe('PuckComponentsService', () => {
  let service: PuckComponentsService;
  let repository: MongoRepository<PuckComponent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuckComponentsService,
        {
          provide: getRepositoryToken(PuckComponent),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PuckComponentsService>(PuckComponentsService);
    repository = module.get<MongoRepository<PuckComponent>>(getRepositoryToken(PuckComponent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new puck component', async () => {
      // Arrange
      jest.spyOn(repository, 'create').mockReturnValue(mockPuckComponent as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockPuckComponent as any);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(repository.save).toHaveBeenCalledWith(mockPuckComponent);
      expect(result).toEqual(mockPuckComponent);
    });
  });

  describe('findAll', () => {
    it('should return an array of puck components with default pagination', async () => {
      // Arrange
      const mockComponents = [mockPuckComponent];
      jest.spyOn(repository, 'find').mockResolvedValue(mockComponents as any);

      // Act
      const result = await service.findAll();

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        take: 10,
        skip: 0
      });
      expect(result).toEqual(mockComponents);
    });

    it('should return an array of puck components with custom pagination', async () => {
      // Arrange
      const mockComponents = [mockPuckComponent];
      const paginationDto: PaginationDto = { limit: 5, offset: 10 };
      jest.spyOn(repository, 'find').mockResolvedValue(mockComponents as any);

      // Act
      const result = await service.findAll(paginationDto);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        take: 5,
        skip: 10
      });
      expect(result).toEqual(mockComponents);
    });
  });

  describe('findOne', () => {
    it('should find and return a puck component by id', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockPuckComponent as any);

      // Act
      const result = await service.findOne(mockId);

      // Assert
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: new ObjectId(mockId) });
      expect(result).toEqual(mockPuckComponent);
    });

    it('should throw NotFoundException if component not found', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(mockId)).rejects.toThrow(NotFoundException);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: new ObjectId(mockId) });
    });
  });

  describe('update', () => {
    it('should update and return a puck component', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      const updatedComponent = {
        ...mockPuckComponent,
        content: {
          ...mockPuckComponent.content,
          props: {
            ...mockPuckComponent.content.props,
            title: 'Updated Title',
            description: 'Updated Description'
          }
        }
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPuckComponent as any);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedComponent as any);

      // Act
      const result = await service.update(mockId, mockUpdateDto);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockId);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedComponent);
    });
  });

  describe('remove', () => {
    it('should remove a puck component', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPuckComponent as any);
      jest.spyOn(repository, 'remove').mockResolvedValue(undefined);

      // Act
      await service.remove(mockId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockId);
      expect(repository.remove).toHaveBeenCalledWith(mockPuckComponent);
    });
  });
});