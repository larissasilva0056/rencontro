import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesModule } from '../cases/cases.module';
import { ALL_ENTITIES } from '../entities';
import { AdminController, OrganizationsController, PublicController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature(ALL_ENTITIES), CasesModule],
  controllers: [AdminController, OrganizationsController, PublicController],
  providers: [AdminService],
})
export class AdminModule {}
