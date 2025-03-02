export function isValidDate(date: string): boolean {
    const parsedDate = new Date(date);

    return !isNaN(parsedDate.getTime());
}

export function isValidDateInstance(date: Date): boolean {
    return !isNaN(date.getTime());
}

export function stringToDate(dateString: string): Date {
    const parsedDate = new Date(dateString);

    if (!isValidDateInstance(parsedDate)) {
        throw new Error(`Invalid date (eg: ${dateString})`);
    }

    return parsedDate;
}

export function dateToString(date: Date): string {
    if (!isValidDateInstance(date)) {
        throw new Error(`Invalid date`);
    }

    return date.toISOString()
}

export function createFutureDate(seconds: number): Date {
    if (seconds <= 0) {
        throw new Error('Seconds should a positive number greater than 0');
    }

    const currentDate = new Date();

    return new Date(currentDate.getTime() + seconds * 1000);
}

export function createPastDate(seconds: number): Date {
    if (seconds <= 0) {
        throw new Error('Seconds should a positive number greater than 0');
    }

    const currentDate = new Date();

    return new Date(currentDate.getTime() - seconds * 1000);
}

export function replaceTemplateVars(content: string, vars: Record<string, string> = {}): string {
    return content.replace(/{{(\w+)}}/g, (_, key) => (key in vars ? vars[key] : `{{${key}}}`));
}

export function dateDiffInSeconds(date1: Date, date2: Date): number {
    if (!isValidDateInstance(date1)) {
        throw new Error('Invalid date (eg: date1)');
    }

    if (!isValidDateInstance(date2)) {
        throw new Error('Invalid date (eg: date2)');
    }

    return Math.ceil((date1.getTime() - date2.getTime()) / 1000);
}
