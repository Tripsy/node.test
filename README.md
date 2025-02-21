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

# Setup

### 1. Add `hosts` record
To configure your hosts file, refer to this guide:  
[How to Edit the Hosts File on macOS](https://phoenixnap.com/kb/mac-hosts-file)

### 2. Initialize Docker container
Start the Docker container using the following command:

```bash
local $ docker compose up
```

### 3. Connect to the Docker container
Once the container is running, connect to it with:

```bash
local $ docker exec -it node.test /bin/bash
```

### 4. Install dependencies inside the container
Run the following command to install project dependencies:

```bash
docker $ pnpm install
```

### 5. Run the application
Finally, start the application in development mode with:

```bash
docker $ pnpm run dev
```

# Notes & Limitations

- req & res objects have injected additional properties - check /src/types/express.d.ts
- workers are not set run on separate process (updates will be required to workers if they will be set to run on separate process) // TODO @Bogdan
- /providers - Reusable utilities, external integrations; Encapsulates infrastructure (e.g., Redis, DB connections)
- /subscriber - Business logic, high-level functionality; Manages operations, workflows

# Usage

### Pino

Levels:
    trace (10),
    debug (20),
    info (30),
    warn (40),
    error (50),
    fatal (60)

```
import logger from './services/logger'
import {childLogger} from './helpers/log'

logger.debug('Test debug')
logger.info('Test info')
logger.error({
        transaction_id: 1234,
        user_id: 'johndoe'
    },
    'Transaction failed'
)

const userLogger = childLogger(logger, 'user')

userLogger.info('This is a log from user')
```
### TypeORM

> **Warning**
> Always check the migrations before run it, sometimes columns are dropped

```bash
// Generate migration file
docker $ pnpx tsx ./node_modules/typeorm/cli.js migration:generate -d /var/www/html/src/config/data-source.config.ts /var/www/html/src/migrations/init

// Run new migrations - update DB structure
docker $ pnpx tsx ./node_modules/typeorm/cli.js migration:run -d /var/www/html/src/config/data-source.config.ts

// Revert last migration
docker $ pnpx tsx ./node_modules/typeorm/cli.js migration:revert -d /var/www/html/src/config/data-source.config.ts

// Reset 
docker $ pnpx tsx ./node_modules/typeorm/cli.js schema:drop -d src/config/data-source.config.ts

//Import db-data
docker $ pnpx tsx /var/www/html/src/seed-data/template.seed.ts
```

# Dependencies

- [Pino](https://github.com/pinojs/pino)
- [Mysql2](https://github.com/sidorares/node-mysql2)
- [TypeORM](https://github.com/typeorm/typeorm)
- [i18n](https://github.com/i18next/i18next)
- [nodemailer](https://nodemailer.com/)
- [zod](https://zod.dev)
- [helmet](https://helmetjs.github.io/)
- [ioredis](https://github.com/luin/ioredis)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [node-cron](https://github.com/node-cron/node-cron)
- [BullMQ](https://docs.bullmq.io/)

# TODO

1. tests
2. setup policy
3. add user role & user maybe user permission
4. user.controller -> create is only for authorized so add role & permissions
5. user.controller -> updateStatus && updatePassword && updateEmail
6. account.controller -> signUp
7. loading optimization - export constants or functions ?! logger and validators

REVIEW AT THIS POINT

1. template.routes.ts && template.controller.ts
2. once policy is set up for admin on read and find allow to included entries marked as deleted
3. build pino-transport-mysql - log.entity is created in /entities but add .ts
4. test pino-transport-email
5. create cron checks: 
    - daily - count errors in last 24 hours (group by label, count)
    - daily - checkOverlapping cron jobs based on expressionInterval
    - weekly - count warnings in last 7 days (group by label, count, expectedRunTime, average run time)
    - monthly - report unused cron jobs based on last_run_at
6. Add rate limiting for failed logins
    
IDEAS

1. Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app.
2. https://expressjs.com/en/advanced/best-practice-performance.html
3. Functional tests - Super test
4. Unit tests - Jest
