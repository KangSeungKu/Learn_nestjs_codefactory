import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModel } from './posts/entities/posts.entity';
import { UserModel } from './users/entities/users.entity';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  ENV_DB_DATABASE,
  ENV_DB_HOST,
  ENV_DB_PASSWORD,
  ENV_DB_PORT,
  ENV_DB_USERNAME,
} from './common/const/env-keys.const';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      // provider마다 기입을 해 줘야 했지만, 해당 설정으로 app.module에서 한 번만 선언해주면 됨.
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env[ENV_DB_HOST],
      port: Number(process.env[ENV_DB_PORT]),
      username: process.env[ENV_DB_USERNAME],
      password: process.env[ENV_DB_PASSWORD],
      database: process.env[ENV_DB_DATABASE],
      entities: [PostModel, UserModel],
      synchronize: true,
    }),
    PostsModule,
    AuthModule,
    UsersModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
