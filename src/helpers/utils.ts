export function stringToDate(dateString: string): Date {
    return new Date(dateString);
}

export function dateToString(date: Date): string {
    return date.toISOString()
}

export function createExpireDate(seconds: number): Date {
    const currentDate = new Date();

    return new Date(currentDate.getTime() + seconds * 1000);
}