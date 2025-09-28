import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RefreshToken {
  @Field()
  accessToken!: string;
}
