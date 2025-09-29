import { Field, ObjectType } from "@nestjs/graphql";

type ClassType<T = any> = new (...args: any[]) => T;

type ApiResponseOptions = {
  isArray?: boolean;
};

export function ApiResponseType<TItem>(
  TItemClass: ClassType<TItem>,
  options: ApiResponseOptions = {},
) {
  const { isArray = false } = options;

  @ObjectType({ isAbstract: true })
  abstract class ApiResponseClass {
    @Field(() => Boolean)
    success!: boolean;

    @Field(() => String)
    message!: string;

    @Field(() => (isArray ? [TItemClass] : TItemClass), { nullable: true })
    data?: TItem | TItem[];

    @Field(() => [String], { nullable: true })
    errors?: string[];
  }

  return ApiResponseClass;
}
