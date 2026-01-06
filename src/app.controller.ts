import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { Permissions, Public } from './common/decorators/permissions.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  health() {
    return { ok: true };
  }

  @Get()
  @Permissions('read:items')
  getHello(): string {
    return this.appService.getHello();
  }

  @Put()
  @Permissions('update:items')
  update(@Body('item') item: unknown) {
    return { message: 'Item updated', item };
  }

  @Post()
  @Permissions('create:items')
  create(@Body('item') item: unknown) {
    return { message: 'Item created', item };
  }

  @Delete()
  @Permissions('delete:items')
  delete() {
    return { message: 'Item deleted' };
  }
}
