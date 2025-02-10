import { Request, Response, NextFunction } from 'express';
import {apiDocumentationUrl} from '../helpers/system';

export const metaDocumentation = (...args: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.output.meta(apiDocumentationUrl(...args), 'documentationUrl');

        next(); // Proceed to the next middleware or route handler
    };
};

export default metaDocumentation;
