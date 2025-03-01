export function stringToDate(dateString: string): Date {
    return new Date(dateString);
}

export function dateToString(date: Date): string {
    return date.toISOString()
}

export function createFutureDate(seconds: number): Date {
    const currentDate = new Date();

    return new Date(currentDate.getTime() + seconds * 1000);
}

export function createPastDate(seconds: number): Date {
    const currentDate = new Date();

    return new Date(currentDate.getTime() - seconds * 1000);
}

export function replaceTemplateVars(content: string, vars: Record<string, string> = {}): string {
    return content.replace(/{{(\w+)}}/g, (_, key) => vars[key] || '');
}

export function dateDiffInSeconds(date1: Date, date2: Date): number {
    return Math.ceil((date1.getTime() - date2.getTime()) / 1000);
}
