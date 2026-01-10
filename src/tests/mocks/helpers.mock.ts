import { createFutureDate, createPastDate } from '@/lib/helpers';

export function mockPastDate(t: number = 86400): Date {
	return createPastDate(t);
}

export function mockFutureDate(t: number = 86400): Date {
	return createFutureDate(t);
}

export function mockUuid(): string {
	return '123e4567-e89b-12d3-a456-426614174000';
}
