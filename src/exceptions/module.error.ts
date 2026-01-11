export class ModuleError extends Error {
	constructor(message?: string) {
		super();

		this.message = message ?? 'Module not found';
	}
}
