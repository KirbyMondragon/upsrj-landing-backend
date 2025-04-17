import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

// Archivo principal para iniciar la aplicación NestJS
async function bootstrap() {
  // Crear app especificando el tipo de aplicación como NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configurar límites para las peticiones a través de la configuración de Express
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true });
  
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api'); // Establece un prefijo global para todas las rutas

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en los DTOs
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no definidas
      transform: true, // Transforma los datos a los tipos esperados
    })
  );

  const config = new DocumentBuilder()
    .setTitle('UPSRJ Backend API')
    .setDescription('Backend API documentation for the UPSRJ Landing Page')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Configura la documentación Swagger

  await app.listen(process.env.PORT ?? 3000);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger documentation available at: ${await app.getUrl()}/docs`);
}
bootstrap();
