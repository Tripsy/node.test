import {NextFunction, Request, Response} from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.output
        .success(false)
        .message('Not Found')
        .code(404);

    res.status(res.output.code()).json(res.output.raw());
};
