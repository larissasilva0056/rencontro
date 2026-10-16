import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewCaseDto {
  @IsBoolean() approve: boolean;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
export class UpdateUserDto {
  @IsOptional() @IsBoolean() blocked?: boolean;
  @IsOptional() @IsBoolean() approved?: boolean;
}
export class ForwardDto {
  @Type(() => Number) @IsInt() organizationId: number;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class CommunicationDto {
  @Type(() => Number) @IsInt() caseId: number;
  @IsString() @MinLength(5) @MaxLength(1000) message: string;
}
