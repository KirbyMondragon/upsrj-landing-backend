import { Test, TestingModule } from '@nestjs/testing';
import { PuckComponentsController } from './puck-components.controller';
import { PuckComponentsService } from './puck-components.service';
import { CreatePuckComponentDto } from './dto/create-puck-component.dto';
import { UpdatePuckComponentDto } from './dto/update-puck-component.dto';
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

// Mock del servicio
const mockPuckComponentsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PuckComponentsController', () => {
  let controller: PuckComponentsController;
  let service: PuckComponentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuckComponentsController],
      providers: [
        {
          provide: PuckComponentsService,
          useValue: mockPuckComponentsService,
        },
      ],
    }).compile();

    controller = module.get<PuckComponentsController>(PuckComponentsController);
    service = module.get<PuckComponentsService>(PuckComponentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new puck component', async () => {
      // Arrange
      jest.spyOn(service, 'create').mockResolvedValue(mockPuckComponent as any);

      // Act
      const result = await controller.create(mockCreateDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockPuckComponent);
    });
  });

  describe('findAll', () => {
    it('should return an array of puck components', async () => {
      // Arrange
      const paginationDto: PaginationDto = { limit: 10, offset: 0 };
      const mockComponents = [mockPuckComponent];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockComponents as any);

      // Act
      const result = await controller.findAll(paginationDto);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockComponents);
    });
  });

  describe('findOne', () => {
    it('should return a single puck component', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPuckComponent as any);

      // Act
      const result = await controller.findOne(mockId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockPuckComponent);
    });
  });

  describe('update', () => {
    it('should update a puck component', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      const updatedComponent = {
        ...mockPuckComponent,
        content: {
          ...mockPuckComponent.content,
          type: 'section',
          props: {
            ...mockPuckComponent.content.props,
            title: 'Updated Title',
            description: 'Updated Description'
          }
        }
      };
      jest.spyOn(service, 'update').mockResolvedValue(updatedComponent as any);

      // Act
      const result = await controller.update(mockId, mockUpdateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(mockId, mockUpdateDto);
      expect(result).toEqual(updatedComponent);
    });
  });

  describe('remove', () => {
    it('should remove a puck component', async () => {
      // Arrange
      const mockId = '507f1f77bcf86cd799439011';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      // Act
      await controller.remove(mockId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(mockId);
    });
  });
});