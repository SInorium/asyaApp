import { createZodDto } from 'nestjs-zod';
import { LoginSchema, RegisterSchema, UserSchema } from '@asya/shared';

export class LoginDto extends createZodDto(LoginSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class UserDto extends createZodDto(UserSchema) {}
