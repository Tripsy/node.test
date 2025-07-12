import {NextFunction, Request, Response} from 'express';
import {cfg} from '../config/settings.config';

function getLanguageFromHeaders(acceptLanguage?: string): string {
    if (!acceptLanguage) {
        return '';
    }

    return acceptLanguage.split(',')[0].split('-')[0];
}

async function languageMiddleware(req: Request, _res: Response, next: NextFunction) {
    let lang: string = req.query.lang as string || '';

    if (!lang) {
        lang = getLanguageFromHeaders(req.headers['accept-language']);
    }

    // Attach lang value to the request object
    if (cfg('app.supportedLanguages').includes(lang)) {
        req.lang = lang;
    } else {
        req.lang = cfg('app.language');
    }

    next();
}

export default languageMiddleware;