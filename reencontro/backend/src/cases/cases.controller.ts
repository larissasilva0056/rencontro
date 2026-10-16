import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, OptionalJwtAuthGuard, Roles, RolesGuard } from '../common/auth-helpers';
import { AuthUser, Role, TipStatus } from '../common/enums';
import {
  AuthorizeShareDto, CreateCaseDto, CreateTipDto, ListCasesQuery, LocatedDto, ReportDto, ReviewTipDto, ShareDto, UpdateCaseDto,
} from './cases.dto';
import { CasesService } from './cases.service';
import { TipsService } from './tips.service';

@Controller('cases')
export class CasesController {
  constructor(private svc: CasesService, private tips: TipsService) {}

  @UseGuards(OptionalJwtAuthGuard) @Get()
  list(@Query() q: ListCasesQuery, @CurrentUser() u?: AuthUser) { return this.svc.list(q, u); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.FAMILIAR, Role.ONG) @Get('mine')
  mine(@CurrentUser() u: AuthUser) { return this.svc.mine(u); }

  @UseGuards(OptionalJwtAuthGuard) @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number, @CurrentUser() u?: AuthUser) { return this.svc.detail(id, u); }

  @UseGuards(OptionalJwtAuthGuard) @Get(':id/updates')
  history(@Param('id', ParseIntPipe) id: number, @CurrentUser() u?: AuthUser) { return this.svc.history(id, u); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.FAMILIAR, Role.ONG) @Post()
  create(@Body() dto: CreateCaseDto, @CurrentUser() u: AuthUser) { return this.svc.create(dto, u); }

  @UseGuards(JwtAuthGuard) @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCaseDto, @CurrentUser() u: AuthUser) { return this.svc.update(id, dto, u); }

  @UseGuards(JwtAuthGuard) @Post(':id/located')
  located(@Param('id', ParseIntPipe) id: number, @Body() dto: LocatedDto, @CurrentUser() u: AuthUser) { return this.svc.markLocated(id, dto.note, u); }

  @UseGuards(JwtAuthGuard) @Patch(':id/share-authorization')
  authorize(@Param('id', ParseIntPipe) id: number, @Body() dto: AuthorizeShareDto, @CurrentUser() u: AuthUser) { return this.svc.setShareAuthorization(id, dto.authorized, u); }

  @UseGuards(OptionalJwtAuthGuard) @Post(':id/share')
  share(@Param('id', ParseIntPipe) id: number, @Body() dto: ShareDto, @CurrentUser() u?: AuthUser) { return this.svc.share(id, dto.network, u); }

  @UseGuards(JwtAuthGuard) @Post(':id/report')
  report(@Param('id', ParseIntPipe) id: number, @Body() dto: ReportDto, @CurrentUser() u: AuthUser) { return this.svc.report(id, dto.reason, u); }

  @UseGuards(JwtAuthGuard) @Post(':id/tips')
  sendTip(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTipDto, @CurrentUser() u: AuthUser) { return this.tips.create(id, dto, u); }

  @UseGuards(JwtAuthGuard) @Get(':id/tips')
  caseTips(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.tips.forCase(id, u); }
}

@Controller('tips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TipsController {
  constructor(private tips: TipsService) {}

  @Roles(Role.FAMILIAR, Role.ONG) @Get('mine')
  mine(@CurrentUser() u: AuthUser) { return this.tips.mine(u); }

  @Roles(Role.ADMIN, Role.ONG, Role.ORGAO) @Get()
  queue(@Query('status') status: TipStatus = TipStatus.EM_ANALISE, @CurrentUser() u: AuthUser) { return this.tips.queue(status, u); }

  @Roles(Role.ADMIN, Role.ONG, Role.ORGAO) @Patch(':id/review')
  review(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewTipDto, @CurrentUser() u: AuthUser) { return this.tips.review(id, dto, u); }
}
