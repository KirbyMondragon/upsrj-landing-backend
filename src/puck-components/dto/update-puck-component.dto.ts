import { PartialType } from '@nestjs/mapped-types';
import { CreatePuckComponentDto } from './create-puck-component.dto';

export class UpdatePuckComponentDto extends PartialType(CreatePuckComponentDto) {}
