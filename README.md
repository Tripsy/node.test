# Description

This project started as a learning process and the goal was to build a simple **REST Api (Node.Js - Express / TypeScript)**, 
hence the name `node.test`

Fast-forward several months later, this project has evolved into a full-featured **Boilerplate**, with a [solid structure](#Structure),
supporting a complex REST Api with plenty of [features](#Features) and based on many [goodies](#Characteristics) including: 
- **Complete authentication system**;
- Multiple background workers (email, cron, etc.);
- Advanced logging and error handling;
- Custom middlewares;
- Multi-language support;
- Strong validation and policy-based authorization.

The code follows **best practices** and **design principles** like SOLID, KISS, DRY, and strong security standards. 
The codebase is fully typed in **TypeScript** — no as any shortcuts. **Biome** (on top of ESLint) ensures code quality.

The recommended database is **PostgreSQL**, though it has also been tested with MariaDB, using **TypeORM** as the ORM layer. 

At this date (e.g.: 2026 January), all [dependencies](#Dependencies) are updated to their latest versions, and Node.js 22 is supported.

A ready-to-use Docker environment is provided for quick [setup](#Setup).

This project is still a work in progress and next goals are:
 - Complete the tests suite
 - Modularizing [features](#Features) as reusable NPM packages
 - Adding new [features](#Features) such as articles, images, products, orders, invoices, payments, and subscriptions

Ultimately, this boilerplate can serve as a starter template with ready-made functionality or 
as a foundation to quickly build MVPs, CMS platforms, or E-commerce solutions. 

Meanwhile, I'm open to suggestions, feedback and If you find this project useful, please consider giving it a star ⭐

> On a [separate project](https://github.com/Tripsy/nextjs.test), powered by **React / Next.js** I also developed a working #FrontEnd interface to demonstrate the usability of the `authentification system` and 
> I have started building an **Administration Dashboard** with some features already included: Users, Permissions, Template,
> Logs for data, mail queue, entities operations

> I'm also #OpenForWork

# Characteristics

- [x] Ready-to-use boilerplate with a modular, feature-based architecture
- [x] Custom Error Handling
- [x] Logging (powered by Pino) to file, db, or email
- [x] TypeORM Wrapper: A layer over TypeORM for smoother database interactions.
- [x] Request validation (powered by Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration (e.g.: res.locals.output)
- [x] Caching (powered by ioredis)
- [x] Cron jobs provider with automatic discovery and registration
- [x] Auto-registered event listeners
- [x] Email sending via queues (powered by BullMQ)
- [x] Template management for emails and pages
- [x] Subscribers (powered by TypeORM)
- [x] Custom Middlewares
    - Auth (auth.middleware → res.locals.auth)
    - REST API Documentation Link (meta-documentation.middleware)
    - Determine language (language.middleware → res.locals.lang)
    - Params validation 
- [x] Internationalization / language management (powered by i18next)
- [x] Complete `Auth System`: Secure, modular auth layer supporting user registration, login (token-based authentication), etc
- [x] Authorization policies based on user roles and permissions
- [x] Testing (powered by Jest & Supertest)

# Features

### Core features

- [x] account: register, login, removeToken, logout, passwordRecover, passwordRecoverChange, passwordUpdate, emailConfirm, emailUpdate, me, sessions, edit, delete
- [x] cron-history.controller: read, delete, find
- [x] log-data.controller: read, delete, find
- [x] log-history.controller: read, delete, find
- [x] mail-queue.controller: read, delete, find
- [x] permission.controller (create, read, update, delete, restore, find
- [x] template.controller (create, read, update, delete, restore, find)
- [x] user.controller (create, read, update, delete, restore, find, statusUpdate)
- [x] user-permission.controller (create, delete, restore, find)

### Modular features


- [x] carrier: create, read, update, delete, restore, find
- [x] category: create, read, update, delete, restore, find, statusUpdate
- [x] client: create, read, update, delete, restore, find, statusUpdate
- [x] discount: create, read, update, delete, restore, find

- [x] place: create, read, update, delete, restore, find


### Upcoming features

- article
- brand
- image
- invoice
- order
- order-shipping
- payment
- product
- subscription
- term

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

### 5. While using PostgreSQL only

 ```sql
CREATE SCHEMA IF NOT EXISTS system;
CREATE SCHEMA IF NOT EXISTS logs;
```  

### 6. Run the application
Finally, start the application in development mode with:

```
$ pnpm run dev
```

# Notes

- res object contains additional properties - check /src/types/express.d.ts (is in .gitignore)
- right now workers are not set run on separate process

# TypeORM

> **Warning**
> Always check the migrations before run it, sometimes columns are dropped

```bash
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
$ pnpx tsx /var/www/html/src/features/templates/template.seed.ts  
$ pnpx tsx /var/www/html/src/features/permission/permission.seed.ts
```

# Tests

```bash
$ pnpm run test --testTimeout=60000
$ pnpm run test account.functional.ts --testTimeout=60000 --detectOpenHandles
$ pnpm run test account.unit.ts --detect-open-handles
```



# Structure

```
├── docker/
├── src/
│   ├── config/            # Configuration files
│   ├── cron-jobs/         # Cron job definitions
│   ├── database/
│   │   ├── migrations/    # TypeORM migrations
│   ├── exceptions/        # Custom error classes
│   ├── features/          # Feature-based modules
│   │   ├── user/
│   │   │   ├── locales/
│   │   │   │   └── en.json
│   │   │   ├── tests/
│   │   │   │   └── user.mock.ts
│   │   │   │   └── user-controller.test.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.subscriber.ts
│   │   │   └── user.validator.ts
│   │   │   └── user.seed.ts 
│   │   └── ...            # Other features (invoice, category, etc.)
│   ├── helpers/           # Utilities (date, string, object, validators, etc.)
│   ├── middleware/        # Custom Express middlewares
│   ├── providers/         # Infrastructure (DB, Redis, logger, email, cron)
│   ├── queues/            # BullMQ queues
│   ├── shared/
│   │   ├── abstracts/     # Base / abstract classes
│   │   ├── listeners/     # Core event listeners
│   │   ├── locales/       # Shared language
│   ├── templates/         # Email / page templates
│   └── tests/             # Jest & Supertest tests
│   └── types/             # Global/shared TypeScript types
│   └── workers/           # Background workers
├── .env
├── docker-compose.yml
├── biome.json
└── tsconfig.json
```

# TODO

1. make features as package:
    - move specific cron-jobs into features
    - create separate migration per entity
2. CLI ...should have a command which runs seed if exist 
    - create user.seed.ts - default admin user 
3. do tests for the rest of controllers
4. do tests for validators
5. feature - brand 
6. feature - images 
7. Go on FE → category, place, brand, client
8. Go on FE #2 → carrier, discount, 
9. Go on FE #3 → image (multer - File upload handling)
10. wip entities:
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
11. For reporting create separate DB table (in a new schema `reporting`). This new table can be updated via subscribers.
12. Review "ideas"

# Bugs & issues

1. API documentation > swagger-ui-express
2. cron hanging / delaying / semaphore 
3. CI/CD 
4. For "Star" use category for "cars"

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
- [nunjucks](https://github.com/mozilla/nunjucks) - Templating engine for JavaScript
- [dayjs](https://day.js.org/) - Day.js is a minimalist JavaScript library that parses, validates, manipulates, and displays dates and times 

Dev only:

- [jest](https://jestjs.io/) - JavaScript testing framework
- [supertest](https://www.npmjs.com/package/supertest) - HTTP assertion library for testing Node.js servers
- [madge](https://github.com/pahen/madge) - Helps finding circular dependencies