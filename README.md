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
    - user.controller (create, read, update, delete, find, statusUpdate)
    - account.controller (register, login, removeToken, logout, passwordRecover, passwordRecoverChange, passwordUpdate, emailConfirm, emailUpdate)
    - permission.controller (create, read, update, delete, find)
    
    TODO
    - log-data.controller (read, delete, find)
    - user-permission.controller (create, delete, find)
    - template.controller (create, read, update, delete, find)
      
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
- [nunjucks](https://github.com/mozilla/nunjucks)

# TESTS

```
$ pnpm run test --testTimeout=60000
$ pnpm run test account.functional.ts -testTimeout=60000 --detectOpenHandles
$ pnpm run test account-register.unit.ts --detect-open-handles

```

# TODO

REVIEW AT THIS POINT

1. for user-controller we need context data - user id to be applied in history - see pemission.subscriber for example
2. test restore and see if subscriber is triggered
3. user-permission routes
4. after permissions load > cache req.user ?!
5. template.routes.ts && template.controller.ts
6. Tests 
    - validators
   - controllers
       - permission.controller
   - middleware
       - output-handler.middleware
       - validate-params.middleware
   - providers
7. CI/CD
8. test pino-transport-email

# BUGS

1. when tests run together pnpm run test --testTimeout=60000 they exceed timeout; the problem is not around the time but the app is not loading in functional tests

# IDEAS

1. Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app.
2. https://expressjs.com/en/advanced/best-practice-performance.html
3. router.param - Adds callback triggers to route parameters, where name is the name of the parameter and callback is the callback function
4. settings saved in DB
5. cron hanging / delaying / semaphore ?!

# TEMP


const results = await cronHistoryRepository.query(`
;
`, [startDate, endDate, startDate, endDate]);