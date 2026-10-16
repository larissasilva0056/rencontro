import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CaseStatus, Role } from './common/enums';
import { Case, CaseUpdate, User } from './entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private log = new Logger('Seed');
  constructor(@InjectRepository(User) private users: Repository<User>, @InjectRepository(Case) private cases: Repository<Case>, @InjectRepository(CaseUpdate) private updates: Repository<CaseUpdate>) {}

  private async user(name: string, email: string, role: Role, password: string, org?: string) {
    const found = await this.users.findOne({ where: { email } });
    if (found) return found;
    return this.users.save(this.users.create({ name, email, role, organizationName: org ?? null, approved: true, passwordHash: await bcrypt.hash(password, 10), termsAcceptedAt: new Date() }));
  }

  async onApplicationBootstrap() {
    await this.user('Administrador', process.env.ADMIN_EMAIL ?? 'admin@reencontro.app', Role.ADMIN, process.env.ADMIN_PASSWORD ?? 'Admin@12345');
    if (process.env.SEED_DEMO !== 'true' || (await this.cases.count()) > 0) return;
    const fam = await this.user('Larissa Souza', 'familiar@demo.app', Role.FAMILIAR, 'Demo@12345');
    await this.user('Cidadão Demo', 'cidadao@demo.app', Role.CIDADAO, 'Demo@12345');
    await this.user('ONG Vida', 'ong@demo.app', Role.ONG, 'Demo@12345', 'ONG Vida');
    await this.user('Polícia Civil', 'orgao@demo.app', Role.ORGAO, 'Demo@12345', 'Polícia Civil');
    const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const demo = [
      { fullName: 'Ana Souza', age: 16, heightCm: 160, eyeColor: 'castanhos', hairColor: 'longos e lisos', skinColor: 'clara', city: 'São Paulo', state: 'SP', lastSeenPlace: 'Região central', status: CaseStatus.PUBLICADO },
      { fullName: 'Carlos Mendes', age: 34, heightCm: 178, eyeColor: 'verdes', hairColor: 'curto castanho', skinColor: 'parda', city: 'Salvador', state: 'BA', lastSeenPlace: 'Pelourinho', status: CaseStatus.PUBLICADO },
      { fullName: 'Juliana Costa', age: 27, heightCm: 165, eyeColor: 'pretos', hairColor: 'cacheados', skinColor: 'negra', city: 'Belo Horizonte', state: 'MG', lastSeenPlace: 'Savassi', status: CaseStatus.AGUARDANDO },
    ];
    for (const [i, d] of demo.entries()) {
      const c = await this.cases.save(this.cases.create({
        ...d, disappearedAt: day(i * 5 + 2), vulnerable: false, urgent: d.age < 18, owner: fam, contactInfo: '(11) 90000-0000',
        shareAuthorized: i === 0, acceptedTermsAt: new Date(), publishedAt: d.status === CaseStatus.PUBLICADO ? new Date() : null,
        characteristics: 'Cicatriz pequena no queixo.', circumstances: 'Saiu de casa e não retornou.',
      } as any) as unknown as Case);
      await this.updates.save(this.updates.create({ case: c, author: fam, description: 'Cadastro realizado. Caso enviado para verificação.' }));
      if (c.status === CaseStatus.PUBLICADO) await this.updates.save(this.updates.create({ case: c, author: null, description: 'Caso verificado e publicado.' }));
    }
    this.log.log('Dados de demonstração criados (senha das contas demo: Demo@12345).');
  }
}
