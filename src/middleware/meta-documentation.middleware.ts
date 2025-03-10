import {Request, Response, NextFunction} from 'express';
import {apiDocumentationUrl} from '../helpers/system.helper';

export const metaDocumentation = (...args: string[]) => {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.output.meta(apiDocumentationUrl(...args), 'documentationUrl');

        next(); // Proceed to the next middleware or route handler
    };
};

export default metaDocumentation;
