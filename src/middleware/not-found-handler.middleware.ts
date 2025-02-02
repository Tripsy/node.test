import {NextFunction, Request, Response} from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.output
        .success(false)
        .message('Not Found');

    res.status(404).json(res.output);
};
