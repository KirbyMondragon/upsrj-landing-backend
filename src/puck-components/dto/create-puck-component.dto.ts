import { IsString, IsObject, IsOptional, ValidateNested, IsArray, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Class representing the content structure of a Puck component
 * Contains type, props, and optional readOnly settings
 */
class PuckContent {
    @IsString()
    type: string;

    @IsObject()
    props: {
        id: string;
        title: string;
        description: string;
    };

    @IsOptional()
    @IsObject()
    readOnly?: {
        title?: boolean;
        description?: boolean;
    };
}

/**
 * Class representing the root configuration of a Puck component
 * Contains props and optional readOnly settings
 */
class PuckRoot {
    @IsObject()
    props: {
        title: string;
    };

    @IsOptional()
    @IsObject()
    readOnly?: {
        title?: boolean;
    };
}

/**
 * Class representing a zone item in a Puck component
 * Zone items are nested components within the main component
 */
class PuckZoneItem {
    @IsString()
    type: string;

    @IsObject()
    props: {
        id: string;
        title: string;
    };

    @IsOptional()
    @IsObject()
    readOnly?: {
        title?: boolean;
    };
}

/**
 * Data Transfer Object for creating a new Puck component
 * Validates the structure of the component data before processing
 */
export class CreatePuckComponentDto {

    @IsOptional()   
    @IsString()
    slug?: string;

    @ValidateNested()
    @Type(() => PuckContent)
    content: PuckContent;

    @IsObject()
    @ValidateNested()
    @Type(() => PuckRoot)
    root: PuckRoot;

    @IsDefined()
    @IsObject()
    zones: Record<string, PuckZoneItem[]>;
}
