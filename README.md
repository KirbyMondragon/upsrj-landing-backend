<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# UPSRJ Landing Backend

## Prerequisites

Before you download the project, make sure you have the following installed:

### Node.js (This proyect use v22.14.0)
Node.js is an open-source, cross-platform runtime environment that allows you to run JavaScript code on the server-side.
```
https://nodejs.org/es
```



### Typescript (This proyect use Version 5.4.3)
TypeScript checks a program for errors before execution, and does so based on the kinds of values, making it a static type checker
```bash
npm install -g typescript
```

### PNPM(10.8.1)
pnpm is a fast, disk space-efficient package manager for JavaScript and Node.js.
```bash
npm install -g pnpm@latest-10
```

### NestJS CLI(11.0.6)
The Nest CLI is a command-line interface tool that helps you initialize, develop, and maintain your Nest applications.
```bash
npm i -g @nestjs/cli
```

### MongoDB (version 7.0.8)
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


###  Database Setup with Docker
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
