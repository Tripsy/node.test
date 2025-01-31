import 'dotenv/config';
import path from 'path';

function buildPath(...args: string[]): string {
    return path.join(...args);
}

export function buildRootPath(...args: string[]): string {
    return buildPath(process.env.ROOT_PATH, ...args);
}

export function buildSrcPath(...args: string[]): string {
    return buildPath(process.env.SRC_PATH, ...args);
}
