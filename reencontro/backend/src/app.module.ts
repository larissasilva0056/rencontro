import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { ALL_ENTITIES } from './entities';
import { NotificationsModule } from './notifications/notifications.module';
import { SeedService } from './seed.service';
import { StorageModule } from './storage/storage.module';
import { UploadsModule } from './uploads/uploads.module';

/** DB_TYPE=sqlite (arquivo local) ou postgres (local via Docker ou nuvem: Neon, Supabase, Railway, RDS...). */
function dbConfig(): TypeOrmModuleOptions {
  const synchronize = process.env.DB_SYNC !== 'false'; // em produção: DB_SYNC=false + migrations
  if (process.env.DB_TYPE === 'postgres') {
    return { type: 'postgres', url: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true', entities: ALL_ENTITIES, synchronize };
  }
  return { type: 'better-sqlite3', database: process.env.DB_PATH ?? 'reencontro.sqlite', entities: ALL_ENTITIES, synchronize };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dbConfig()),
    TypeOrmModule.forFeature(ALL_ENTITIES),
    StorageModule, NotificationsModule, AiModule, AuthModule, CasesModule, AdminModule, UploadsModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
