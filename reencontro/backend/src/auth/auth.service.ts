import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { User } from '../entities';
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private users: Repository<User>, private jwt: JwtService) {}

  private publicUser(u: User) {
    const { passwordHash, ...rest } = u as any;
    return rest;
  }
  private token(u: User) {
    return this.jwt.sign({ sub: u.id, role: u.role });
  }

  async register(dto: RegisterDto) {
    if (!dto.acceptedTerms) throw new BadRequestException('É necessário aceitar os termos de uso e a política de privacidade (LGPD).');
    const email = dto.email.toLowerCase();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('Este e-mail já está cadastrado.');
    const needsApproval = dto.role === Role.ONG || dto.role === Role.ORGAO;
    if (needsApproval && !dto.organizationName) throw new BadRequestException('Informe o nome da instituição.');
    const user = await this.users.save(
      this.users.create({
        name: dto.name, email, role: dto.role, phone: dto.phone ?? null,
        organizationName: dto.organizationName ?? null,
        passwordHash: await bcrypt.hash(dto.password, 10),
        approved: !needsApproval, termsAcceptedAt: new Date(),
      }),
    );
    if (needsApproval) return { pendingApproval: true, message: 'Cadastro recebido. Um administrador vai validar sua instituição antes do primeiro acesso.' };
    return { token: this.token(user), user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u').addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email.toLowerCase() }).getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('E-mail ou senha inválidos.');
    if (user.blocked) throw new ForbiddenException('Conta bloqueada. Entre em contato com a administração.');
    if (!user.approved) throw new ForbiddenException('Conta aguardando aprovação do administrador.');
    return { token: this.token(user), user: this.publicUser(user) };
  }

  async me(id: number) {
    return this.publicUser(await this.users.findOneOrFail({ where: { id } }));
  }
  async updateProfile(id: number, dto: UpdateProfileDto) {
    await this.users.update(id, dto);
    return this.me(id);
  }
  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.users.createQueryBuilder('u').addSelect('u.passwordHash').where('u.id = :id', { id }).getOneOrFail();
    if (!(await bcrypt.compare(dto.current, user.passwordHash))) throw new BadRequestException('Senha atual incorreta.');
    await this.users.update(id, { passwordHash: await bcrypt.hash(dto.next, 10) });
    return { ok: true };
  }
}
