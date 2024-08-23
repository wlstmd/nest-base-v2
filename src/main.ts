import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

declare const module: any;

async function bootstrap() {
  try {
    const port = 80;

    const app = await NestFactory.create(AppModule);

    // CORS 설정
    app.enableCors({
      origin: [
        '',
        'http://localhost:3000', // 로컬 개발 환경을 위해 추가
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: 'Content-Type, Accept, Authorization',
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle('API')
      .setDescription('개발을 위한 API 문서입니다.')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    await app.listen(port);

    if (module.hot) {
      module.hot.accept();
      module.hot.dispose(() => app.close());
    }

    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.error('Error during bootstrap:', error);
  }
}

bootstrap();
