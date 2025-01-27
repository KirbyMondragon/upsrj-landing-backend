import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, //tranforma la data
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Sustentabilidad Backend')
    .setDescription('El sistema facilita la gestión ')
    .setVersion('1.0')
    .addTag('Alumnos')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);

  logger.log(`The Backend is running in ${process.env.PORT}`)

}
bootstrap();
