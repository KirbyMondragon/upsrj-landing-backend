import { PartialType } from '@nestjs/mapped-types';
import { CreatePuckComponentDto } from './create-puck-component.dto';

/**
 * Data Transfer Object for updating an existing Puck component
 * 
 * Extends CreatePuckComponentDto as a PartialType, making all properties optional
 * This allows for partial updates of component properties
 */
export class UpdatePuckComponentDto extends PartialType(CreatePuckComponentDto) {}
