<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# UPSRJ Landing Backend

## Prerequisites

Before you download the project, make sure you have the following installed:

### Node.js
Node.js is an open-source, cross-platform runtime environment that allows you to run JavaScript code on the server-side.
```
https://nodejs.org/es
```
### Typescript
TypeScript checks a program for errors before execution, and does so based on the kinds of values, making it a static type checker
```bash
npm install -g typescript
```

### PNPM
pnpm is a fast, disk space-efficient package manager for JavaScript and Node.js.
```bash
npm install -g pnpm@latest-10
```

### NestJS CLI
The Nest CLI is a command-line interface tool that helps you initialize, develop, and maintain your Nest applications.
```bash
npm i -g @nestjs/cli
```

### MongoDB 
Install MongoDB 
```bash
https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.6-signed.msi
```

## Project Setup

### 1. Clone the project
```bash
$ git clone <NombreDelProyecto>
```

### 2. Install dependencies
```bash
$ pnpm install
```



## Running the Application

```bash
# Development mode
$ pnpm run start

# Watch mode (auto-reload)
$ pnpm run start:dev

# Production mode
$ pnpm run start:prod
```


## Technology Stack

* Postgres
* MongoDB
```
npm i mongodb@5.9.2
```
* NodeJs
* Docker / Docker Compose
* NestJS

## Development Notes

### For MAC users (remove prettier)
```
pnpm remove prettier eslint-config-prettier eslint-plugin-prettier
```

### Bcrypt migration
```
pnpm i bcryptjs
```

### Legacy (Before that MongoDB)

### 3. Configure Environment Variables
This environment will help you with the connection to the database (Postgres).
"This connection is for when you use it with Postgres directly installed on your system."
#### Option A: For direct Postgres installation
Create a `.env` file in the project root with:
```bash
JWT_SECRET='Secreto'
PORT=3002
DB_PASSWORD=root
DB_NAME=NameOFTheDatabase
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
CONTAINER_NAME=NameOFTheContainer

# Password for seed creation
PASSWORD_SEED='SecretoContraseña'
```

#### Option B: For Docker setup
Create a `.env` file in the project root with:
```bash
JWT_SECRET='Secreto'
PORT=3002
DB_PASSWORD=root
DB_NAME=NameOFTheDatabase
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
CONTAINER_NAME=NameOFTheContainer

# Password for seed creation
PASSWORD_SEED='SecretoContraseña'
```

## Módulo de Imágenes con GridFS

El backend utiliza GridFS con MongoDB para almacenar y gestionar imágenes de manera eficiente. Este módulo facilita la integración con Puck para la visualización de imágenes en el frontend.

### Características
- Procesamiento de imágenes con Sharp (redimensionamiento y optimización)
- Almacenamiento en GridFS de MongoDB
- Conversión automática a formato WebP para mejor rendimiento
- API REST para cargar, obtener y eliminar imágenes

### Dependencias necesarias
```bash
# Instalación de Sharp para procesamiento de imágenes
pnpm add sharp

# Aprobar scripts de compilación de Sharp
pnpm approve-builds sharp
```

### Uso en el Frontend con Puck

1. **Subir una imagen**:
   ```typescript
   // Ejemplo de cómo subir una imagen desde el frontend
   async function uploadImage(file) {
     // Convertir archivo a base64
     const base64 = await fileToBase64(file);
     
     const response = await fetch('http://localhost:3000/api/images', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
       },
       body: JSON.stringify({
         base64Image: base64,
         width: 500,  // opcional
         height: 300  // opcional
       })
     });
     
     const data = await response.json();
     return data.imageUrl; // URL para usar en Puck
   }
   
   // Función auxiliar para convertir archivo a base64
   function fileToBase64(file) {
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onload = () => resolve(reader.result);
       reader.onerror = error => reject(error);
     });
   }
   ```

2. **Usar la imagen en Puck**:
   ```typescript
   // En el componente Puck
   const MyPuckComponent = {
     defaultProps: {
       imageUrl: '',
     },
     render: ({ imageUrl }) => (
       <div>
         {imageUrl && <img src={`http://localhost:3000/api${imageUrl}`} alt="Uploaded image" />}
       </div>
     )
   }
   ```

3. **Peticiones de imágenes directas**:
   - Acceder directamente a una imagen: `http://localhost:3000/api/images/{uuid}`
   - Listar todas las imágenes: `http://localhost:3000/api/images`

### 4. Database Setup with Docker
```bash
$ docker-compose up -d
```

## Deployment Guide

1. Create the `.env` file
2. Configure production environment variables
3. Build the Docker image:
```
docker-compose -f docker-compose.prod.yaml --env-file .env up --build
```
4. Reload existing image:
```
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d
```
