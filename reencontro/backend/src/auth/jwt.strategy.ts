import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AuthUser } from '../common/enums';
import { User } from '../entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private users: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    });
  }
  async validate(payload: { sub: number }): Promise<AuthUser> {
    const u = await this.users.findOne({ where: { id: payload.sub } });
    if (!u || u.blocked || !u.approved) throw new UnauthorizedException();
    return { id: u.id, role: u.role, name: u.name, email: u.email };
  }
}
