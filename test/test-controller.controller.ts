import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get('unprotected')
  unprotected() {
    return { message: 'This should fail with 500' };
  }
}

