import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../common/enums';

export class RegisterDto {
  @IsString() @MinLength(3) @MaxLength(100) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' }) @MaxLength(72) password: string;
  @IsIn([Role.FAMILIAR, Role.CIDADAO, Role.ONG, Role.ORGAO], { message: 'Tipo de usuário inválido' })
  role: Role;
  @IsOptional() @IsString() @MaxLength(120) organizationName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsBoolean() acceptedTerms: boolean;
}
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}
export class ChangePasswordDto {
  @IsString() current: string;
  @IsString() @MinLength(8) @MaxLength(72) next: string;
}
