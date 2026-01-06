import { jest } from '@jest/globals';
import { appReady, closeHandler, server } from '@/app';
import PolicyAbstract from "@/lib/abstracts/policy.abstract";

beforeAll(async () => {
    await appReady;
});

afterAll(async () => {
    const srv = server;

    if (srv) {
        await new Promise<void>((resolve, reject) => {
            srv.close((err) => {
                if (err) {
                    return reject(err);
                }

                // Add delay before closing handlers
                setTimeout(() => {
                    closeHandler().then(resolve).catch(reject);
                }, 1000); // 1 second delay
            });
        });
    } else {
        await closeHandler();
    }

    // Additional cleanup for TypeORM
    await new Promise(resolve => setTimeout(resolve, 500));
});

export function mockNotAuthorized(policy: PolicyAbstract) {
    jest.spyOn(policy, 'isAuthenticated').mockReturnValue(false);
}

export function mockNotAllowed(policy: PolicyAbstract) {
    jest.spyOn(policy, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(policy, 'isAdmin').mockReturnValue(false);
}

export function mockAuthorized(policy: PolicyAbstract) {
    jest.spyOn(policy, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(policy, 'isAdmin').mockReturnValue(false);
    jest.spyOn(policy, 'hasPermission').mockReturnValue(true);
}

// export function createAuthContext(
// 	partialAuth?: Partial<AuthContext>,
// ): AuthContext {
// 	return {
// 		id: 0,
// 		email: '',
// 		name: '',
// 		language: 'en',
// 		role: 'visitor',
// 		operator_type: null,
// 		permissions: [],
// 		activeToken: '',
// 		...partialAuth,
// 	};
// }
