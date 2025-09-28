import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateUserInput } from './CreateUserInput';

@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['password', 'email'] as const),
) {}
