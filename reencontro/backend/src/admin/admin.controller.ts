import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/auth-helpers';
import { AuthUser, CaseStatus, Role } from '../common/enums';
import { CommunicationDto, ForwardDto, ReviewCaseDto, UpdateUserDto } from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private svc: AdminService) {}
  @Get('overview') overview() { return this.svc.overview(); }
  @Get('cases') cases(@Query('status') status: CaseStatus = CaseStatus.AGUARDANDO, @CurrentUser() u: AuthUser) { return this.svc.casesByStatus(status, u); }
  @Patch('cases/:id/review') review(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewCaseDto, @CurrentUser() u: AuthUser) { return this.svc.reviewCase(id, dto, u); }
  @Delete('cases/:id') remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.svc.deleteCase(id, u); }
  @Post('cases/:id/forward') forward(@Param('id', ParseIntPipe) id: number, @Body() dto: ForwardDto, @CurrentUser() u: AuthUser) { return this.svc.forward(id, dto, u); }
  @Get('users') users() { return this.svc.listUsers(); }
  @Patch('users/:id') user(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() u: AuthUser) { return this.svc.updateUser(id, dto, u); }
  @Get('organizations') orgs() { return this.svc.listOrganizations(); }
  @Get('reports') reports() { return this.svc.reportsList(); }
  @Patch('reports/:id/resolve') resolve(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: AuthUser) { return this.svc.resolveReport(id, u); }
  @Get('audit') audit() { return this.svc.auditList(); }
}

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ONG, Role.ORGAO, Role.ADMIN)
export class OrganizationsController {
  constructor(private svc: AdminService) {}
  @Get('dashboard') dashboard(@CurrentUser() u: AuthUser) { return this.svc.orgDashboard(u); }
  @Get('cases') cases(@Query('scope') scope: 'forwarded' | 'all' = 'forwarded', @CurrentUser() u: AuthUser) { return this.svc.orgCases(scope, u); }
  @Get('communications') comms(@CurrentUser() u: AuthUser) { return this.svc.myCommunications(u); }
  @Post('communications') communicate(@Body() dto: CommunicationDto, @CurrentUser() u: AuthUser) { return this.svc.communicate(dto, u); }
  @Get('duplicates') duplicates() { return this.svc.duplicates(); }
}

@Controller('public')
export class PublicController {
  constructor(private svc: AdminService) {}
  @Get('stats') stats() { return this.svc.publicStats(); }
  @Get('partners') partners() { return this.svc.partners(); }
}
