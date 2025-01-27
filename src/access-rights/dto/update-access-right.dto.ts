import { PartialType } from '@nestjs/swagger';
import { CreateAccessRightDto } from './create-access-right.dto';

export class UpdateAccessRightDto extends PartialType(CreateAccessRightDto) {}
