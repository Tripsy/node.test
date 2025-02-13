
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
    /decorators
    /entities
    /enums
    /exceptions
    /helpers
    /interfaces
    /locales
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
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

# Documentation

- https://typeorm.io/entities#column-types-for-mysql--mariadb
- https://typeorm.io/repository-api
- https://typeorm.io/select-query-builder
- https://zod.dev

# TODO

2. handle authorization
3. for account routes - recoverPassword, changePassword
3. setup policy
4. route to handle password recover & change
5. once policy is set up for admin on read and find allow to included entries marked as deleted
6. build pino-transport-mysql - log.entity is created in /entities but add .ts
7. test pino-transport-email

# Ideas

1. https://expressjs.com/en/advanced/best-practice-performance.html

Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app. Use the compression middleware for gzip compression in your Express app. 

2. https://expressjs.com/en/advanced/best-practice-performance.html#ensure-your-app-automatically-restarts

3. Tests

# Temp

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


-----------------

import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';

class UserService {
async deleteUser(userId: number): Promise<void> {
await UserRepository.softDelete(userId);
}

    async restoreUser(userId: number): Promise<void> {
        await UserRepository.restore(userId);
    }

    async getDeletedUsers(): Promise<UserEntity[]> {
        return await UserRepository.find({
            where: {
                deletedAt: Not(IsNull()),
            },
        });
    }
}

export default new UserService();
