export function stringToDate(dateString: string): Date {
    return new Date(dateString);
}

export function dateToString(date: Date): string {
    return date.toISOString()
}