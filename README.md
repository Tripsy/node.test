# Features

- [x] Settings Management
- [x] Automatic Error Handling
- [x] Logging (powered by Pino) to file, db or email
- [x] TypeORM Wrapper: A layer over TypeORM for smoother database interactions.
- [x] Request validators (using Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration (e.g.: res.locals.output)
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
    - Auth (auth.middleware → res.locals.auth)
    - REST API Documentation Link (meta-documentation.middleware)
    - Determine language (language.middleware → res.locals.lang)
    - Params validation 
- [x] Language management (powered by i18next)
- [x] User system (e.g.: register, login, logout, password recover, password change, email confirm)
   - user roles (e.g.: admin, user, operator)
   - login based on JWT tokens (managed by `account-token.repository`)
   - password recovery (managed by `account-recovery.repository`)
- [x] Policies (based on user roles and permissions)
- [x] Features (eg: REST Api)
    - account.controller: register, login, removeToken, logout, passwordRecover, passwordRecoverChange, passwordUpdate, emailConfirm, emailUpdate, me, sessions, edit, delete
    - article: 
    - brand: 
    - carrier: create, read, update, delete, restore, find
    - category: create, read, update, delete, restore, find, statusUpdate
    - client: create, read, update, delete, restore, find, statusUpdate
    - cron-history.controller: read, delete, find
    - discount: create, read, update, delete, restore, find
    - image: 
    - invoice: 
    - log-data.controller: read, delete, find
    - log-history.controller: read, delete, find
    - mail-queue.controller: read, delete, find
    - order: 
    - order-shipping: 
    - payment: 
    - permission.controller (create, read, update, delete, restore, find
    - place: create, read, update, delete, restore, find
    - product: 
    - subscription:
    - template.controller (create, read, update, delete, restore, find)
    - term: 
    - user.controller (create, read, update, delete, restore, find, statusUpdate)
    - user-permission.controller (create, delete, restore, find)

- [x] Tests (powered by Jest & Supertest)

# Setup

### 1. Add `hosts` record
For configuration refer to this guide:  
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

- res object contains additional properties - check /src/types/express.d.ts (is in .gitignore)
- workers are not set run on separate process (updates will be required to workers if they are set to run on separate process)
- /providers - Reusable utilities, external integrations; Encapsulates infrastructure (e.g., Redis, DB connections)

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

# TESTS

```
$ pnpm run test --testTimeout=60000
$ pnpm run test account.functional.ts --testTimeout=60000 --detectOpenHandles
$ pnpm run test account.unit.ts --detect-open-handles

```

# TODO

1. tests - log-data.functional.ts is working
2. make features as package
3. brand 
4. images 
5. Go on FE → category, place, brand, client
6. Go on FE #2 → carrier, discount, 
7. Go on FE #3 → image (multer - File upload handling)
8. wip entities:
    - article
        - article-category
        - article-content
        - article-tag  
        - article-track
    - brand
        - brand-content 
    - image  
      - image-content
    - invoice
    - order
        - order-product
    - order-shipping
        - order-shipping-product
    - payment
    - product
        - product-attribute
        - product-category
        - product-tag
        - product-content
    - subscription
        - subscription-evidence
    - term
9. For reporting create separate DB table (in a new schema `reporting`). This new table can be updated via subscribers.
10. Review "ideas"

# IDEAS

1. API documentation > swagger-ui-express
2. settings saved in DB
3. cron hanging / delaying / semaphore ?!
4. CI/CD (once tests are working)

# BUGS & ISSUES

1. For "Star" use category for "cars"
2. Missing tests
    - controllers
    - validators
    - middleware
        - output-handler.middleware
        - validate-params.middleware
    - providers
3. Recap Jest; Tests are failing

# Dependencies

- [Pino](https://github.com/pinojs/pino) - Fast, low-overhead Node.js logger
- [Mysql2](https://github.com/sidorares/node-mysql2) - MySQL client for Node.js with TypeScript support
- [TypeORM](https://github.com/typeorm/typeorm) - ORM for TypeScript and JavaScript with support for multiple databases
- [i18next](https://github.com/i18next/i18next) - Internationalization framework for JavaScript/Node.js
- [nodemailer](https://nodemailer.com/) - Email sending library for Node.js
- [zod](https://zod.dev) - TypeScript-first schema validation with static type inference
- [helmet](https://helmetjs.github.io/) - Security middleware for Express.js
- [express-rate-limit](https://express-rate-limit.mintlify.app/overview) - Rate limiting middleware for Express.js
- [ioredis](https://github.com/luin/ioredis) - Robust Redis client for Node.js
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JSON Web Token implementation
- [node-cron](https://github.com/node-cron/node-cron) - Task scheduler for Node.js
- [BullMQ](https://docs.bullmq.io/) - Redis-based message queue for Node.js
- [jest](https://jestjs.io/) - JavaScript testing framework
- [supertest](https://www.npmjs.com/package/supertest) - HTTP assertion library for testing Node.js servers
- [nunjucks](https://github.com/mozilla/nunjucks) - Templating engine for JavaScript

# DEVELOPMENT STEPS

- last commit before merging main with new entities "Commits on Dec 5, 2025" - "+ unified validators"
- merged new entities into main branch on 18 dec 2025