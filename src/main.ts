import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        // IsNumber decoration와 같은 class decoration를
        // Type decoration없이 자동으로 변경해주는 옵션
        enableImplicitConversion: true,
      },
      whitelist: true,
      // dto에 정의된 이외의 값이 들어올 경우, error를 표시
      // forbidNonWhitelisted: true,
    }),
  );

  // 모든 Exception에 대해 로깅이 가능
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
bootstrap();
