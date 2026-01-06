import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  permissions: string[];
}

interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const handler = ctx.getHandler();
    const cls = ctx.getClass();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      cls,
    ]);

    if (isPublic) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    // Simpele auth implementatie: verwacht "Bearer <token>"
    // Voor testen: token "valid-token" is geldig
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7);
    if (token !== 'valid-token') {
      throw new UnauthorizedException('Invalid token');
    }

    // Simuleer een user object voor de permissions guard
    request.user = {
      id: 'user-123',
      email: 'test@example.com',
      permissions: [
        'read:items',
        'update:items',
        'delete:items',
        'create:items',
      ],
    };

    return true;
  }
}
