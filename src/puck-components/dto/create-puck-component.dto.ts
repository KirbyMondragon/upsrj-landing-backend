import { IsString, IsObject, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreatePuckComponentDto {
    @ValidateNested()
    @Type(() => PuckContent)
    content: PuckContent;

    @IsObject()
    @ValidateNested()
    @Type(() => PuckRoot)
    root: PuckRoot;

    @IsObject()
    @ValidateNested({ each: true })
    @Type(() => PuckZoneItem)
    zones: Record<string, PuckZoneItem[]>;

}
