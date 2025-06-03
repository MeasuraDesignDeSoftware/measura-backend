import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@domain/users/entities/user.entity';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: UserRole;
    [key: string]: any;
  };
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    if (request.user) {
      return { ...request.user };
    }

    return null;
  },
);
