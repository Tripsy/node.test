import { appReady, closeHandler, server } from '@/app';
import type { AuthContext } from '@/lib/types/express';

beforeAll(async () => {
	await appReady;
});

afterAll(async () => {
	const srv = server;

	if (srv) {
		await new Promise<void>((resolve, reject) => {
			srv.close((err) => {
				if (err) return reject(err);

				closeHandler().then(resolve).catch(reject);
			});
		});
	} else {
		await closeHandler();
	}
});

export function createAuthContext(
	partialAuth?: Partial<AuthContext>,
): AuthContext {
	return {
		id: 0,
		email: '',
		name: '',
		language: 'en',
		role: 'visitor',
		operator_type: null,
		permissions: [],
		activeToken: '',
		...partialAuth,
	};
}
