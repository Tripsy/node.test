export enum LogHistoryAction {
	CREATED = 'created',
	UPDATED = 'updated',
	DELETED = 'deleted',
	REMOVED = 'removed',
	RESTORED = 'restored',
	STATUS = 'status',
	PASSWORD_CHANGE = 'password_change',
}

export type LogHistoryDestination = 'pino' | 'db' | null;
