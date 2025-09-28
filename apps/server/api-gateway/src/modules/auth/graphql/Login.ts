import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './CreateUserInput';

@InputType()
export class LoginInput extends PartialType(
  OmitType(CreateUserInput, ['YOB', 'name'] as const),
) {}
