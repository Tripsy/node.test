export function getMetadataValue(metadata: Record<string, string>, key: string): string {
    return metadata?.[key] ?? '';
}

export function compareMetadataValue(metadata1: Record<string, string>, metadata2: Record<string, string>, key: string): boolean {
    return getMetadataValue(metadata1, key) === getMetadataValue(metadata2, key);
}