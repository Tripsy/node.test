
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

# Structure

```
/docker
/logs
/src
    /config
    /controllers
    /entities
    /enums
    /exceptions
    /helpers
    /interfaces
    /middleware
    /migrations
    /policies
    /providers
        - Reusable utilities, external integrations; Encapsulates infrastructure (e.g., Redis, DB connections)
    /repositories
    /routes
    /services
        - Business logic, high-level functionality; Manages operations, workflows
    /subscribers
    /types
    /validators
    app.ts
```

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

```bash
// Generate migration file
docker $ pnpx tsx ./node_modules/typeorm/cli.js migration:generate -d /var/www/html/src/config/init-database.config.ts /var/www/html/src/migrations/init

// Run new migrations - update DB structure
docker $ pnpx tsx ./node_modules/typeorm/cli.js migration:run -d /var/www/html/src/config/init-database.config.ts

// Revert last migration
docker $ pnpx tsx ./node_modules/typeorm/cli.js migration:revert -d /var/www/html/src/config/init-database.config.ts
```

# Packages

- [Pino](https://github.com/pinojs/pino)
- [Mysql2](https://github.com/sidorares/node-mysql2)
- [TypeORM](https://github.com/typeorm/typeorm)
- [i18n](https://github.com/i18next/i18next)
- [nodemailer](https://nodemailer.com/)
- [zod](https://zod.dev)
- [helmet](https://helmetjs.github.io/)
- [ioredis](https://github.com/luin/ioredis)

# Documentation

- https://typeorm.io/entities#column-types-for-mysql--mariadb
- https://typeorm.io/repository-api
- https://typeorm.io/select-query-builder
- https://zod.dev

# TODO

1. update
2. list
3. delete
4. handle authorization
3. setup policy
5. build pino-transport-mysql - log.entity is created in /entities but add .ts
6. test pino-transport-email

# Ideas

https://expressjs.com/en/advanced/best-practice-performance.html

Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app. Use the compression middleware for gzip compression in your Express app. 

https://expressjs.com/en/advanced/best-practice-performance.html#ensure-your-app-automatically-restarts


class UserPolicy {
    static create(req: Request): boolean {
        // Example: Only admins can create users
        return req.user?.role === 'admin';
    }

    static update(req: Request, user: UserEntity): boolean {
        // Users can only update their own profiles, unless they're an admin
        return req.user?.id === user.id || req.user?.role === 'admin';
    }

    static delete(req: Request, user: UserEntity): boolean {
        // Only admins can delete users
        return req.user?.role === 'admin';
    }

    static view(req: Request, user: UserEntity): boolean {
        // Users can view their own profile or if they are admin
        return req.user?.id === user.id || req.user?.role === 'admin';
    }
}


export const Create = asyncHandler(async (req: Request, res: Response) => {
// Check if the user is authorized to create a new user
if (!UserPolicy.create(req)) {
res.status(403); // Forbidden
res.output.message(lang('user.error.unauthorized'));
return res.json(res.output);
}
