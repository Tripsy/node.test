import {Request, Response, NextFunction} from 'express'
import logger from '../services/logger'
import {childLogger} from './log'
import NotFoundError from '../exceptions/NotFoundError'

// TODO Implement standard API response

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        message: 'Not Found'
    })
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const systemLogger = childLogger(logger, 'system')

    systemLogger.error({
        errorInstance: err
    }, err.name + ': ' + err.message)

    if (err instanceof NotFoundError) {
        return res.status(err.statusCode).json({
            message: err.message // It's okay to output the reason here
        })
    }

    res.status(500).json({
        message: 'Internal Server Error' // We don't want to leak internal errors
    })
}

// TODO

// // Async route handler
// app.get('/async', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         throw new Error('Async error!'); // Simulate an async error
//     } catch (err) {
//         next(err); // Pass the error to the error-handling middleware
//     }
// });
//
// should be replaced by

// const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         fn(req, res, next).catch(next); // Automatically catch errors
//     };
// };
//
// // Async route handler using the wrapper
// app.get('/async', asyncHandler(async (req: Request, res: Response) => {
//     throw new Error('Async error!'); // Simulate an async error
// }));
