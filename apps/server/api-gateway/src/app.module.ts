import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageLocalDefault,
} from 'apollo-server-core';
import * as Shared from '@mebike/shared';
console.log(Shared);

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      csrfPrevention: false,
      plugins: [
        process.env.NODE_ENV === 'production'
          ? (ApolloServerPluginLandingPageDisabled() as any)
          : (ApolloServerPluginLandingPageLocalDefault() as any),
      ],
    }),
    AuthModule,
  ],
})
export class AppModule {}
