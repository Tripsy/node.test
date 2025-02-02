
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

# Usage

### Pino

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

### 1. Generate and run migrations

```bash
docker $ pnpx typeorm migration:generate
docker $ pnpx typeorm migration:run
```
tsx ./node_modules/typeorm/cli.js migration:generate CreateUserTable -d src/entities/user.entity.ts
bash: tsx: command not found

# Packages

- [Pino](https://github.com/pinojs/pino)
- [Mysql2](https://github.com/sidorares/node-mysql2)
- [TypeORM](https://github.com/typeorm/typeorm)
- [i18n](https://github.com/i18next/i18next)
- [nodemailer](https://nodemailer.com/)

# Documentation

- https://typeorm.io/repository-api
- https://typeorm.io/select-query-builder

# TODO

1. Add req to res.output (on fail)
2. run migrations 
3. build pino-transport-mysql
4. CRUD
5. test pino-transport-email

# Ides

https://www.npmjs.com/package/helmet - security related

Gzip compressing can greatly decrease the size of the response body and hence increase the speed of a web app. Use the compression middleware for gzip compression in your Express app. 

https://expressjs.com/en/advanced/best-practice-performance.html#ensure-your-app-automatically-restarts
------------

// Custom transport function
const customTransport = {
target: 'pino/file',
options: { destination: 1 }, // 1 corresponds to process.stdout
level: 'info',
write(chunk: any) {
const logEntry = JSON.parse(chunk);
const level = logEntry.level;
const logRepository =
level === 'error'
? AppDataSource.getRepository(LogError)
: AppDataSource.getRepository(LogInfo);

    const log =
      level === 'error' ? new LogError() : new LogInfo();
    log.level = level;
    log.message = logEntry.msg;
    log.meta = logEntry;

    logRepository.save(log).catch((err) => {
      console.error('Error saving log to database', err);
    });
},
};

// src/entities/Log.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Log {
@PrimaryGeneratedColumn()
id: number;

@Column()
level: string;

@Column()
message: string;

@Column('simple-json', { nullable: true })
meta: Record<string, any>;

@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
timestamp: Date;
}



trace (10)

debug (20)

info (30)

warn (40)

error (50)

fatal (60)
