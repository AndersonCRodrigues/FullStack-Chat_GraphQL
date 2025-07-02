// backend/src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from 'src/common/interfaces/gql-context.interface';
import { User } from 'src/user/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext<GqlContext>();
    return req.user as User;
  },
);
