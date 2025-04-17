import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';          // MongoRepository nos da utilidades específicas para MongoDB
import { ConfigService } from '@nestjs/config';

/*
 * Datos semilla ────────────────────────────────────────────────────────────
 *  initialData   → catálogo de módulos del sistema
 *  initialUsers  → credenciales básicas de usuarios (admin, etc.)
 */
import { initialData, initialUsers } from './data/seed-data';

import { SystemModule } from 'src/access-rights/entities/system-module.entity';
import { AuthService } from '../auth/auth.service';

/**
 * SeedService
 * -------------------------------------------------------------------------
 * Servicio destinado a poblar/actualizar la base de datos con información
 * mínima necesaria para que la aplicación arranque correctamente.
 *
 * Puede ejecutarse desde un comando CLI o exponerse mediante un endpoint
 * protegido.  Re‑ejecutarlo es *idempotente* (no duplica información).
 */
@Injectable()
export class SeedService {
  constructor(
    /**
     * Repositorio MongoDB para la colección SystemModule.  Se usa en lugar de
     * Repository porque necesitamos funciones específicas de MongoDB como
     * `updateOne` y `$setOnInsert`.
     */
    @InjectRepository(SystemModule)
    private readonly systemModuleRepo: MongoRepository<SystemModule>,

    /** Servicio de acceso a variables de entorno */
    private readonly config: ConfigService,

    /**
     * AuthService se inyecta con forwardRef porque existe una dependencia
     * circular (AuthService → SeedService en algún punto).  forwardRef rompe
     * la referencia para que Nest resuelva ambas instancias.
     */
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  /* =======================================================================
   *  executeSeed
   * =======================================================================
   *  Lanza el proceso de seed.  Recibe una contraseña a modo de protección
   *  extra.  Importante cuando se expone como endpoint HTTP.
   * -----------------------------------------------------------------------
   *  1. Verifica que la contraseña coincida con PASSWORD_SEED (env var).
   *  2. Inserta/Actualiza módulos del sistema (idempotente, upsert).
   *  3. Crea usuarios base usando la lógica encapsulada en AuthService.
   * -----------------------------------------------------------------------
   *  Devuelve: string con mensaje de éxito.  Si algo falla, propaga excepción
   *  para que el caller maneje el error.
   * =======================================================================*/
  async executeSeed(password: string) {
    /* --------------------------------------------------------------
     *  Seguridad: simple password check para evitar ejecuciones no
     *  autorizadas.  Coloca la variable PASSWORD_SEED en .env.
     * --------------------------------------------------------------*/
    const PASSWORD_SEED = this.config.get<string>('PASSWORD_SEED');
    if (password !== PASSWORD_SEED) {
      throw new BadRequestException('The password is wrong');
    }

    /* --------------------------------------------------------------
     *  1. Módulos del sistema
     *     Recorremos initialData y hacemos un upsert por moduleName.
     *     - Si existe ⇒ no lo toca (grax a $setOnInsert).
     *     - Si NO existe ⇒ lo inserta.
     *     La operación es concurrente con Promise.all para acelerar.
     * --------------------------------------------------------------*/
    await Promise.all(
      initialData.map(async ({ moduleName, isActive }) => {
        try {
          await this.systemModuleRepo.updateOne(
            { moduleName },                       // Filtro por nombre único
            { $setOnInsert: { moduleName, isActive } },
            { upsert: true },                     // Inserta si no existe
          );
        } catch (err: any) {
          /*
           * Si otro proceso acaba de insertar el documento en el micro‑instante
           * previo, podemos recibir un error de clave duplicada.  Lo ignoramos
           * porque el objetivo (tener el doc presente) ya se cumplió.
           */
          if (err.code !== 11000) throw err;
        }
      }),
    );

    /* --------------------------------------------------------------
     *  2. Usuarios de arranque
     *     Delegamos la creación en AuthService.createSeed para reutilizar
     *     toda la lógica de hashing, validaciones, roles, etc.
     * --------------------------------------------------------------*/
    await Promise.all(
      initialUsers.map(async (dto) => {
        try {
          await this.authService.createSeed(dto);
        } catch (err: any) {
          /*
           * Ignoramos error 11000 (duplicado) para mantener idempotencia.
           * Cualquier otro error se registra y se propaga.
           */
          if (err.code !== 11000) {
            console.error('Error creando usuario seed', err);
            throw err;
          }
        }
      }),
    );

    /* ------------------------------------------------------------------- */
    return 'Seed executed successfully';
  }
}
