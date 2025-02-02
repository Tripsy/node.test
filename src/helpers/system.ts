import {settings} from '../config/settings.config';
import path from 'path';

function buildPath(...args: string[]): string {
    return path.join(...args);
}

export function buildRootPath(...args: string[]): string {
    return buildPath(settings.app.rootPath, ...args);
}

export function buildSrcPath(...args: string[]): string {
    return buildPath(settings.app.srcPath, ...args);
}
