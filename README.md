# Features

- [x] Settings Management
- [x] Automatic Error Handling
- [x] Logging (powered by Pino) - file, db & email
- [x] TypeORM Wrapper: A layer over TypeORM for smoother database interactions.
- [x] Request validators (using Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration (eg: req.output)
- [x] Caching (powered by ioredis)
- [x] Cron Jobs (with history)
   - clean-account-recovery; 
   - clean-account-token; 
   - cron-error-count, cron-time-check, cron-warning-count
   - worker-maintenance 
- [x] Email Sending via Queue (powered by BullMQ)
- [x] Template management (for emails, pages) + seed data (eg: templates.seed.ts)
    - [x] Nunjucks implemented for templating language
- [x] Subscribers (powered by TypeORM)
- [x] Custom Middlewares
    - Auth (auth.middleware -> req.user)
    - REST API Documentation Link (meta-documentation.middleware)
    - Determine language (language.middleware -> req.lang)
    - Params validation 
- [x] Language management (powered by i18next)
- [x] User system (eg: signup, login, logout, password recover, password change, email confirm)
   - user roles (eg: admin, user, operator)
   - login based on JWT tokens (managed by account-token.repository)
   - password recovery (managed by account-recovery.repository)
- [x] Policies (based on user roles & user permissions)
- [x] Controllers (eg: REST Api)
    - user.controller (create, read, update, delete, restore, find, statusUpdate)
    - account.controller (register, login, removeToken, logout, passwordRecover, passwordRecoverChange, passwordUpdate, emailConfirm, emailUpdate)
    - permission.controller (create, read, update, delete, restore, find      
    - user-permission.controller (create, delete, restore, find)
    - template.controller (create, read, update, delete, restore, find)
    - log-data.controller (read, delete, find)
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
- workers are not set run on separate process (updates will be required to workers if they will be set to run on separate process)
- /providers - Reusable utilities, external integrations; Encapsulates infrastructure (e.g., Redis, DB connections)
- /subscriber - Business logic, high-level functionality; Manages operations, workflows

### TypeORM

For `postgres` manually create required schemas:

```
CREATE SCHEMA IF NOT EXISTS system
CREATE SCHEMA IF NOT EXISTS logs
```

> **Warning**
> Always check the migrations before run it, sometimes columns are dropped

```
// Generate migration file for schemas - DEPRECATED
$ pnpx tsx ./node_modules/typeorm/cli.js migration:create src/database/migrations/CreateSchemas

// Generate migration file
$ pnpx tsx ./node_modules/typeorm/cli.js migration:generate -d /var/www/html/src/config/data-source.config.ts /var/www/html/src/database/migrations/init

// Run new migrations - update DB structure
$ pnpx tsx ./node_modules/typeorm/cli.js migration:run -d /var/www/html/src/config/data-source.config.ts

// Revert last migration
$ pnpx tsx ./node_modules/typeorm/cli.js migration:revert -d /var/www/html/src/config/data-source.config.ts

// Reset 
$ pnpx tsx ./node_modules/typeorm/cli.js schema:drop -d src/config/data-source.config.ts

// Import seed data
$ pnpx tsx /var/www/html/src/database/seed-data/template.seed.ts  
$ pnpx tsx /var/www/html/src/database/seed-data/permission.seed.ts
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
$ pnpm run test account.functional.ts --testTimeout=60000 --detectOpenHandles
$ pnpm run test account.unit.ts --detect-open-handles

```

# TODO

1. place (99% done) > client ( 50% done) > category ( + route images) > brand ( + route images)
2. log history to DB
2. wip entities:
    - article
      - article-category
      - article-content
      - article-tag  
      - article-track
    - brand
    - invoice
    - order
    - order-product
    - order-product-shipping
    - order-shipping
    - payment
    - subscription
        - subscription-renewal
    - product
      - product-attribute
      - product-category
      - product-tag
      - product-content
    - term
    - category
      - category-content
3. create a library / package for my utilities - drop moment !!!
4. For reporting create separate DB table (in a new schema `reporting`). This new table can be updated via subscribers.

# BUGS & ISSUES

1. we have some tests which are failing
2. Tests
    - account.controller - emailConfirmSend
    - user.controller - find, statusUpdate missing tests
    - log-data.controller - find missing tests
    - template.controller
    - permission.controller
    - user-permission.controller
    - mail-queue controller
    - validators
    - middleware
        - output-handler.middleware
        - validate-params.middleware
    - providers
3. src/tests/middleware/auth.unit.ts is broken
4. types/express.d.ts - is in .gitignore
5. consider replacing moment library

# IDEAS

1. Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app.
2. https://expressjs.com/en/advanced/best-practice-performance.html
3. router.param - Adds callback triggers to route parameters, where name is the name of the parameter and callback is the callback function
4. settings saved in DB
5. cron hanging / delaying / semaphore ?!
6. CI/CD

# TEMP