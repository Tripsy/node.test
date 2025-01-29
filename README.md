
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

### TypeORM

### 1. Generate and run migrations

```bash
docker $ pnpx typeorm migration:generate
docker $ pnpx typeorm migration:run
```
tsx ./node_modules/typeorm/cli.js migration:generate CreateUserTable -d src/entities/User.ts
bash: tsx: command not found

# Packages

Pino - logging
Mysql2
TypeORM
i18n - language support
nodemailer - email transporter

# Documentation

1. https://typeorm.io/repository-api
2. https://typeorm.io/select-query-builder

# TODO

1. Logging
    morgan / winston / winston-express / https://www.npmjs.com/package/pino
    
    https://github.com/expressjs/morgan
    
2. Error reporting / Debug
3. Standard API response
4. CRUD



Handling Synchronous and Asynchronous Errors:

Synchronous Errors: For errors in synchronous code, you can throw an error, and Express will catch it automatically:

javascript
Copy
Edit
app.get('/', (req, res) => {
throw new Error('Synchronous error');
});
Asynchronous Errors: For asynchronous code, ensure that errors are passed to next() to be handled by the error-handling middleware:

javascript
Copy
Edit
app.get('/', async (req, res, next) => {
try {
const data = await someAsyncFunction();
res.send(data);
} catch (err) {
next(err);
}
});


class NotFoundError extends Error {
constructor(message) {
super(message);
this.name = 'NotFoundError';
this.statusCode = 404;
}
}

// Usage in a route
app.get('/resource/:id', (req, res, next) => {
const resource = getResourceById(req.params.id);
if (!resource) {
return next(new NotFoundError('Resource not found'));
}
res.send(resource);
});


app.use((err, req, res, next) => {
if (err instanceof NotFoundError) {
return res.status(err.statusCode).json({ message: err.message });
}
res.status(500).json({ message: 'Internal Server Error' });
});


------------

Handling Uncaught Exceptions and Rejections: Set up handlers for uncaught exceptions and unhandled promise rejections to prevent the application from crashing unexpectedly:

javascript
Copy
Edit
process.on('uncaughtException', (err) => {
console.error('Uncaught Exception:', err);
// Perform necessary cleanup and exit process if needed
});

process.on('unhandledRejection', (reason, promise) => {
console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// Perform necessary actions
});
Note that while these handlers can prevent crashes, it's often best practice to restart the application after such errors to maintain a clean state.


https://github.com/pinojs/pino/blob/v6.x/docs/help.md#exit-logging

process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
finalLogger.error(err, 'uncaughtException')
process.exit(1)
}))

process.on('unhandledRejection', pino.final(logger, (err, finalLogger) => {
finalLogger.error(err, 'unhandledRejection')
process.exit(1)
}))


logger.error(
{ transaction_id: '12343_ff', user_id: 'johndoe' },
'Transaction failed'
);


https://signoz.io/guides/pino-logger/


const pino = require('pino')
const logger = pino({ level: 'info' })

const childLogger = logger.child({ module: 'user-service' })

logger.info('This is a log message from the main logger')
childLogger.info('This is a log message from the user service')


In this example, the childLogger inherits the configuration from the logger but adds the module: 'user-service' context to each log message it generates. This helps in categorizing and differentiating logs from various parts of your application. It is often helpful in large complex applications where each module might generate numerous log messages. By using child loggers, you can easily identify which module a particular log message came from, making it easier to troubleshoot issues and monitor specific parts of the application.
