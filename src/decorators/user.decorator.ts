import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

export const User = createParamDecorator(
  (data: keyof UserResponseDto, ctx: ExecutionContext): UserResponseDto =>
    ctx.switchToHttp().getRequest()?.user || {},
);
