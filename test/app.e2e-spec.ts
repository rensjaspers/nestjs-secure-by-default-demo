import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Authorization Guardrails (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Public endpoints', () => {
    it('GET /health should be accessible without authentication', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });
  });

  describe('Protected endpoints with authentication', () => {
    const validToken = 'Bearer valid-token';

    it('GET / should require authentication and read:items permission', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Authorization', validToken)
        .expect(200);
    });

    it('PUT / should require authentication and update:items permission', () => {
      return request(app.getHttpServer())
        .put('/')
        .set('Authorization', validToken)
        .send({ item: { id: 1, name: 'Test' } })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Item updated');
        });
    });

    it('POST / should require authentication and create:items permission', () => {
      return request(app.getHttpServer())
        .post('/')
        .set('Authorization', validToken)
        .send({ item: { name: 'New Item' } })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Item created');
        });
    });

    it('DELETE / should require authentication and delete:items permission', () => {
      return request(app.getHttpServer())
        .delete('/')
        .set('Authorization', validToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Item deleted');
        });
    });
  });

  describe('Authentication enforcement', () => {
    it('GET / should return 401 without authorization header', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Missing or invalid authorization header',
          );
        });
    });

    it('GET / should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid token');
        });
    });

    it('GET / should return 401 with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'InvalidFormat')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Missing or invalid authorization header',
          );
        });
    });
  });

  describe('Permissions enforcement', () => {
    const validToken = 'Bearer valid-token';

    // Note: Our simple auth implementation gives all permissions to authenticated users
    // In a real scenario, you'd test with users that have different permission sets
    // For now, we verify that the permissions check runs (it should pass with our test user)
    it('should check permissions after authentication', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Authorization', validToken)
        .expect(200);
    });
  });

  describe('Fail-closed: missing decorators', () => {
    let testApp: INestApplication<App>;

    afterEach(async () => {
      if (testApp) {
        await testApp.close();
      }
    });

    it('should return 500 when endpoint has no @Public() or @Permissions() decorator', async () => {
      const { TestController } = await import('./test-controller.controller');
      const { Module } = await import('@nestjs/common');
      const { APP_GUARD } = await import('@nestjs/core');
      const { AuthenticationGuard } =
        await import('../src/common/guards/authentication.guard');
      const { PermissionsGuard } =
        await import('../src/common/guards/permissions.guard');

      @Module({
        controllers: [TestController],
        providers: [
          { provide: APP_GUARD, useClass: AuthenticationGuard },
          { provide: APP_GUARD, useClass: PermissionsGuard },
        ],
      })
      class TestModule {}

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      testApp = moduleFixture.createNestApplication();
      await testApp.init();

      // We moeten een token meegeven zodat de AuthenticationGuard passeert
      // en de PermissionsGuard de kans krijgt om te checken of er permissions zijn
      await request(testApp.getHttpServer())
        .get('/test/unprotected')
        .set('Authorization', 'Bearer valid-token')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Missing @Public() or @Permissions()',
          );
          expect(res.body.message).toContain('TestController.unprotected');
        });
    });
  });
});
