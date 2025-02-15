import {settings} from '../config/settings.config';
import path from 'path';
import {Request} from 'express';

function buildPath(...args: string[]): string {
    return path.join(...args);
}

export function buildRootPath(...args: string[]): string {
    return buildPath(settings.app.rootPath, ...args);
}

export function buildSrcPath(...args: string[]): string {
    return buildPath(settings.app.srcPath, ...args);
}

export function apiDocumentationUrl(...args: string[]): string {
    return `${settings.app.url}/api-docs/${args.join('/')}`;
}

export function getClientIp(req: Request): string | undefined {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip;
}