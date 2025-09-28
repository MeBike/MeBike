import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  password!: string;

  @Field(() => Int)
  YOB!: number;
}
