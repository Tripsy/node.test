# Features

- [x] Settings Management
- [x] Automatic Error Handling
- [x] Logging (powered by Pino)
- [x] TypeORM Wrapper: A layer over TypeORM for smoother database interactions.
- [x] Request validators (using Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration (eg: req.output)
- [x] Caching (powered by ioredis)
- [x] Cron Jobs (with history)
- [x] Email Sending via Queue (powered by BullMQ)
- [x] Template management (for emails, pages) + seed data (eg: templates.seed.ts)
- [x] Subscribers (powered by TypeORM)
- [x] Custom Middlewares
    - Auth (auth.middleware -> req.user)
    - REST API Documentation Link (meta-documentation.middleware)
    - Determine language (language.middleware -> req.lang)
- [x] Language management (powered by i18next)
- [x] User system (eg: signup, login, logout, password recover, password change, email confirm)
   - user roles (eg: admin, user, operator)
   - login based on JWT tokens (managed by account-token.repository)
   - password recovery (managed by account-recovery.repository)
- [x] Policies (based on user roles & user permissions)
- [x] Controllers (eg: REST Api)
    - user.controller (create, read, update, delete, find, updateStatus, updatePassword, updateEmail)
    - account.controller (login, removeToken, logout, passwordRecover, passwordChange, emailConfirm)
- [x] Tests (powered by Jest & Supertest)

# Setup

### 1. Add `hosts` record
To configure your hosts file, refer to this guide:  
[How to Edit the Hosts File on macOS](https://phoenixnap.com/kb/mac-hosts-file)

### 2. Initialize Docker container
Start the Docker container using the following command:

```
docker compose up
```

### 3. Connect to the Docker container
Once the container is running, connect to it with:
pn
```
docker exec -it node.test /bin/bash
```

### 4. Install dependencies inside the container
Run the following command to install project dependencies:

```
$ pnpm install
```

### 5. Run the application
Finally, start the application in development mode with:

```
$ pnpm run dev
```

# Notes & Limitations

- req & res objects have injected additional properties - check /src/types/express.d.ts
- workers are not set run on separate process (updates will be required to workers if they will be set to run on separate process) // TODO @Bogdan
- /providers - Reusable utilities, external integrations; Encapsulates infrastructure (e.g., Redis, DB connections)
- /subscriber - Business logic, high-level functionality; Manages operations, workflows

### Pino

Levels:
    trace (10),
    debug (20),
    info (30),
    warn (40),
    error (50),
    fatal (60)

### TypeORM

> **Warning**
> Always check the migrations before run it, sometimes columns are dropped

```
// Generate migration file
$ pnpx tsx ./node_modules/typeorm/cli.js migration:generate -d /var/www/html/src/config/data-source.config.ts /var/www/html/src/migrations/init

// Run new migrations - update DB structure
$ pnpx tsx ./node_modules/typeorm/cli.js migration:run -d /var/www/html/src/config/data-source.config.ts

// Revert last migration
$ pnpx tsx ./node_modules/typeorm/cli.js migration:revert -d /var/www/html/src/config/data-source.config.ts

// Reset 
$ pnpx tsx ./node_modules/typeorm/cli.js schema:drop -d src/config/data-source.config.ts

// Import db-data
$ pnpx tsx /var/www/html/src/seed-data/template.seed.ts  
$ pnpx tsx /var/www/html/src/seed-data/permission.seed.ts
```

# Dependencies

- [Pino](https://github.com/pinojs/pino)
- [Mysql2](https://github.com/sidorares/node-mysql2)
- [TypeORM](https://github.com/typeorm/typeorm)
- [i18next](https://github.com/i18next/i18next)
- [nodemailer](https://nodemailer.com/)
- [zod](https://zod.dev)
- [helmet](https://helmetjs.github.io/)
- [ioredis](https://github.com/luin/ioredis)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [node-cron](https://github.com/node-cron/node-cron)
- [BullMQ](https://docs.bullmq.io/)
- [jest](https://jestjs.io/)
- [supertest](https://www.npmjs.com/package/supertest)

# TETS

```
$ pnpx jest
$ pnpx jest system.unit.ts

```

# TODO

1. create separate types based on express.d.ts
2. Write tests 
    - services ?
    - providers
    - controllers

REVIEW AT THIS POINT

1. user-permission routes
2. after permissions load > cache req.user ?!
3. template.routes.ts && template.controller.ts
4. once policy is set up for admin on read and find allow to included entries marked as deleted
5. build pino-transport-mysql - log.entity is created in /entities but add .ts
6. test pino-transport-email
7. create cron checks: 
    - daily - count errors in last 24 hours (group by label, count)
    - daily - checkOverlapping cron jobs based on expressionInterval
    - weekly - count warnings in last 7 days (group by label, count, expectedRunTime, average run time)
    - monthly - report unused cron jobs based on last_run_at

IDEAS

1. Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app.
2. https://expressjs.com/en/advanced/best-practice-performance.html

