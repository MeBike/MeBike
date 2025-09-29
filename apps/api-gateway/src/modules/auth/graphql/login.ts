import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user-nput';

@InputType()
export class LoginInput extends PartialType(
  OmitType(CreateUserInput, ['YOB', 'name'] as const),
) {}
