import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALL_ENTITIES } from '../entities';
import { CasesController, TipsController } from './cases.controller';
import { CasesService } from './cases.service';
import { TipsService } from './tips.service';

@Module({
  imports: [TypeOrmModule.forFeature(ALL_ENTITIES)],
  controllers: [CasesController, TipsController],
  providers: [CasesService, TipsService],
  exports: [CasesService],
})
export class CasesModule {}
