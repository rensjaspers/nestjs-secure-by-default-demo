import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'authorization:isPublic';
export const PERMISSIONS_KEY = 'authorization:permissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

