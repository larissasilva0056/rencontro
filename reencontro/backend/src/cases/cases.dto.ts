import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const remote = process.env.S3_PUBLIC_URL?.replace(/\/$/, '');
/** Só aceita imagens enviadas pela própria plataforma (disco local ou bucket configurado). */
const PHOTO = new RegExp(`^(\\/uploads\\/[\\w-]+\\.(jpg|png)${remote ? `|${esc(remote)}\\/cases\\/[\\w-]+\\.(jpg|png)` : ''})$`);


export class CreateCaseDto {
  @IsString() @MinLength(3) @MaxLength(120) fullName: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(120) age: number;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(30) @Max(250) heightCm?: number;
  @IsOptional() @IsString() @MaxLength(40) eyeColor?: string;
  @IsOptional() @IsString() @MaxLength(40) hairColor?: string;
  @IsOptional() @IsString() @MaxLength(40) skinColor?: string;
  @IsOptional() @IsString() @MaxLength(1000) characteristics?: string;
  @IsString() @Matches(PHOTO, { message: 'Envie uma foto válida (JPG ou PNG).' }) photoUrl: string;
  @IsDateString() disappearedAt: string;
  @IsString() @MinLength(2) @MaxLength(80) city: string;
  @IsString() @Length(2, 2) state: string;
  @IsOptional() @IsString() @MaxLength(200) lastSeenPlace?: string;
  @IsOptional() @IsString() @MaxLength(1500) circumstances?: string;
  @IsBoolean() vulnerable: boolean;
  @IsString() @IsNotEmpty() @MaxLength(120) contactInfo: string;
  @IsBoolean() shareAuthorized: boolean;
  @IsBoolean() imageAuthorization: boolean;
  @IsBoolean() acceptedTerms: boolean;
}

export class UpdateCaseDto extends PartialType(OmitType(CreateCaseDto, ['acceptedTerms', 'imageAuthorization'] as const)) {
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class ListCasesQuery {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @Type(() => Number) @IsInt() minAge?: number;
  @IsOptional() @Type(() => Number) @IsInt() maxAge?: number;
  @IsOptional() @Type(() => Number) @IsInt() sinceDays?: number;
  @IsOptional() @IsIn(['ACTIVE', 'LOCATED', 'ALL']) status?: 'ACTIVE' | 'LOCATED' | 'ALL';
  @IsOptional() @IsIn(['relevant', 'recent']) sort?: 'relevant' | 'recent';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

export class ShareDto { @IsIn(['whatsapp', 'facebook', 'instagram', 'x', 'telegram', 'link']) network: string; }
export class AuthorizeShareDto { @IsBoolean() authorized: boolean; }
export class ReportDto { @IsString() @MinLength(10, { message: 'Descreva o motivo com pelo menos 10 caracteres.' }) @MaxLength(500) reason: string; }
export class LocatedDto { @IsOptional() @IsString() @MaxLength(500) note?: string; }

export class CreateTipDto {
  @IsString() @MinLength(10, { message: 'Descreva a informação com pelo menos 10 caracteres.' }) @MaxLength(2000) description: string;
  @IsOptional() @IsString() @Matches(PHOTO) photoUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) possibleLocation?: string;
  @IsOptional() @IsString() @MaxLength(40) seenAt?: string;
  @IsOptional() @IsString() @MaxLength(120) contact?: string;
}
export class ReviewTipDto {
  @IsIn(['CONFIRMADA', 'DESCARTADA']) decision: 'CONFIRMADA' | 'DESCARTADA';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
