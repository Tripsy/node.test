import {Request} from 'express';
import {getClientIp} from './system.helper';

export function getMetaDataValue(metadata: Record<string, string>, key: string): string {
    return metadata?.[key] ?? '';
}

/**
 * Return true if values are the same for the given key
 *
 * @param metadata1
 * @param metadata2
 * @param key
 */
export function compareMetaDataValue(metadata1: Record<string, string>, metadata2: Record<string, string>, key: string): boolean {
    return getMetaDataValue(metadata1, key) === getMetaDataValue(metadata2, key);
}

export type TokenMetadata = {
    'user-agent': string;
    'accept-language': string;
    'ip': string;
    'os': string;
};

export function tokenMetaData(req: Request): TokenMetadata {
    return {
        'user-agent': req.headers['user-agent'] || '',
        'accept-language': req.headers['accept-language'] || '',
        'ip': getClientIp(req),
        'os': req.body?.os || ''
    }
}