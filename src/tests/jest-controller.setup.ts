import { jest } from '@jest/globals';
import request, { type Response } from 'supertest';
import type { z } from 'zod';
import app, { appReady, closeHandler, server } from '@/app';
import { cacheProvider } from '@/providers/cache.provider';
import type { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import type PolicyAbstract from '@/shared/abstracts/policy.abstract';
import type {
	ValidatorInput,
	ValidatorOutput,
} from '@/shared/abstracts/validator.abstract';
import {
	authorizedSpy,
	notAuthenticatedSpy,
	notAuthorizedSpy,
} from '@/tests/mocks/policies.mock';

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
				}, 1000); // 1-second delay
			});
		});
	} else {
		await closeHandler();
	}

	// Additional cleanup for TypeORM
	await new Promise((resolve) => setTimeout(resolve, 500));
});

// Debugging
export function addDebugResponse(response: Response, hint: string) {
	console.log(hint, response.body);
}

// Controller test - Create
export type CreateValidator = {
	create: () => z.ZodObject<z.ZodRawShape>;
};

type CreateService<E, V extends CreateValidator> = {
	create(data: ValidatorOutput<V, 'create'>): Promise<E>;
};

type ControllerCreateType<E, V extends CreateValidator> = {
	controller: string;
	basePath: string;
	entityMock: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: CreateService<E, V>;
	createData: ValidatorInput<V, 'create'>;
};

export function testControllerCreate<E, V extends CreateValidator>(
	config: ControllerCreateType<E, V>,
) {
	describe(`${config.controller} - create`, () => {
		const link = `${config.basePath}`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).post(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).post(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'create').mockResolvedValue(
				config.entityMock,
			);

			const response = await request(app)
				.post(link)
				.send(config.createData);

			try {
				expect(response.status).toBe(201);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body.data).toHaveProperty(
					'id',
					config.entityMock.id,
				);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - create`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

// Controller test - Read
type ControllerReadType<E> = {
	controller: string;
	basePath: string;
	entityMock: E & {
		id: number;
	};
	policy: PolicyAbstract;
};

export function testControllerRead<E>(config: ControllerReadType<E>) {
	describe(`${config.controller} - read`, () => {
		const link = `${config.basePath}/1`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).get(link).query({});

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).get(link).query({});

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(cacheProvider, 'get').mockImplementation(
				async (_key, _fallback) => {
					return config.entityMock;
				},
			);

			const response = await request(app).get(link).query({});

			try {
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body.data).toHaveProperty(
					'id',
					config.entityMock.id,
				);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - read`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

// Controller test - Update
export type UpdateValidator = {
	update: () => z.ZodObject<z.ZodRawShape>;
};

type UpdateService<E, V extends UpdateValidator> = {
	updateData(
		id: number,
		data: ValidatorOutput<V, 'update'>,
		withDeleted: boolean,
	): Promise<Partial<E>>;
};

type ControllerUpdateType<E, V extends UpdateValidator> = {
	controller: string;
	basePath: string;
	entityMock: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: UpdateService<E, V>;
	updateData: ValidatorInput<V, 'update'>;
};

export function testControllerUpdate<E, V extends UpdateValidator>(
	config: ControllerUpdateType<E, V>,
) {
	describe(`${config.controller} - update`, () => {
		const link = `${config.basePath}/1`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).put(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).put(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'updateData').mockResolvedValue(
				config.entityMock,
			);

			const response = await request(app)
				.put(link)
				.send(config.updateData);

			try {
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body.data).toHaveProperty(
					'id',
					config.entityMock.id,
				);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - update`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

type UpdateWithContentService<E, V extends UpdateValidator> = {
	updateDataWithContent(
		id: number,
		data: ValidatorOutput<V, 'update'>,
		withDeleted: boolean,
	): Promise<Partial<E>>;
};

type ControllerUpdateWithContentType<E, V extends UpdateValidator> = {
	controller: string;
	basePath: string;
	entityMock: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: UpdateWithContentService<E, V>;
	updateData: ValidatorInput<V, 'update'>;
};

export function testControllerUpdateWithContent<E, V extends UpdateValidator>(
	config: ControllerUpdateWithContentType<E, V>,
) {
	describe(`${config.controller} - update`, () => {
		const link = `${config.basePath}/${config.entityMock.id}`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).put(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).put(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(
				config.service,
				'updateDataWithContent',
			).mockResolvedValue(config.entityMock);

			const response = await request(app)
				.put(link)
				.send(config.updateData);

			try {
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body.data).toHaveProperty(
					'id',
					config.entityMock.id,
				);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - update`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

// Controller test - Delete
export type DeleteValidator = {
	delete: () => z.ZodTypeAny;
};

type DeleteMultipleService<V extends DeleteValidator> = {
	delete(data: ValidatorOutput<V, 'delete'>): Promise<number>;
};

type ControllerDeleteMultipleType<V extends DeleteValidator> = {
	controller: string;
	basePath: string;
	policy: PolicyAbstract;
	service: DeleteMultipleService<V>;
};

export function testControllerDeleteMultiple<V extends DeleteValidator>(
	config: ControllerDeleteMultipleType<V>,
) {
	describe(`${config.controller} - delete`, () => {
		const link = `${config.basePath}`;

		const testData = {
			ids: [3, 4],
		};

		it('should fail if not authenticated', async () => {
			notAuthenticatedSpy(config.policy);

			const response = await request(app).delete(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).delete(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'delete').mockResolvedValue(3);

			const response = await request(app).delete(link).send(testData);

			try {
				expect(response.status).toBe(200);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - delete`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

type DeleteSingleService = {
	delete(id: number): Promise<void>;
};

type ControllerDeleteSingleType = {
	controller: string;
	basePath: string;
	policy: PolicyAbstract;
	service: DeleteSingleService;
};

export function testControllerDeleteSingle(config: ControllerDeleteSingleType) {
	describe(`${config.controller} - delete`, () => {
		const link = `${config.basePath}/1`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).delete(link).query({});

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).delete(link).query({});

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'delete').mockResolvedValue();

			const response = await request(app).delete(link).query({});

			try {
				expect(response.status).toBe(200);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - delete`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

// Controller test - Restore
type RestoreSingleService = {
	restore(id: number): Promise<void>;
};

type ControllerRestoreSingleType = {
	controller: string;
	basePath: string;
	policy: PolicyAbstract;
	service: RestoreSingleService;
};

export function testControllerRestoreSingle(
	config: ControllerRestoreSingleType,
) {
	describe(`${config.controller} - restore`, () => {
		const link = `${config.basePath}/1/restore`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).patch(link).query({});

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).patch(link).query({});

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'restore').mockResolvedValue();

			const response = await request(app).patch(link).query({});

			try {
				expect(response.status).toBe(200);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - restore`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

export type FindValidator = {
	find: () => z.ZodObject<z.ZodRawShape>;
};

export function findQueryMock<V extends FindValidator, OB>(query: {
	page?: number;
	limit?: number;
	direction?: OrderDirectionEnum;
	order_by?: OB;
	filter: ValidatorInput<V, 'find'> extends { filter: infer F } ? F : never;
}) {
	const defaults = {
		page: 1,
		limit: 10,
		order_by: 'id' as OB,
		direction: 'DESC' as OrderDirectionEnum,
	};

	return {
		...defaults,
		...query,
	};
}

type FindService<E, V extends FindValidator> = {
	findByFilter(
		data: ValidatorOutput<V, 'find'>,
		withDeleted: boolean,
	): Promise<[E[], number]>;
};

type ControllerFindType<E, V extends FindValidator> = {
	controller: string;
	basePath: string;
	entityMock: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: FindService<E, V>;
	findData: ValidatorInput<V, 'find'> & {
		filter: ValidatorInput<V, 'find'> extends { filter: infer F }
			? F
			: never;
	};
};

export function testControllerFind<E, V extends FindValidator, OB>(
	config: ControllerFindType<E, V>,
) {
	describe(`${config.controller} - find`, () => {
		const link = `${config.basePath}`;

		const mockQuery = findQueryMock<V, OB>(config.findData);

		it('failed validation', async () => {
			authorizedSpy(config.policy);

			const response = await request(app).get(link).query({});

			expect(response.status).toBe(400);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'findByFilter').mockResolvedValue([
				[config.entityMock],
				1,
			]);

			const response = await request(app).get(link).query(mockQuery);

			try {
				expect(response.status).toBe(200);
				expect(response.body.data.entries).toHaveLength(1);
				expect(response.body.data.query.limit).toBe(mockQuery.limit);
			} catch (error) {
				addDebugResponse(response, `${config.controller} - find`);

				throw error; // Re-throw to fail the test
			}
		});
	});
}

// Controller test - Update
type StatusUpdateService = {
	updateStatus(
		id: number,
		status: string,
		withDeleted: boolean,
	): Promise<void>;
};

type ControllerStatusUpdateType<E> = {
	controller: string;
	basePath: string;
	entityMock: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: StatusUpdateService;
	newStatus: string;
};

export function testControllerStatusUpdate<E>(
	config: ControllerStatusUpdateType<E>,
) {
	describe(`${config.controller} - statusUpdate`, () => {
		const link = `${config.basePath}/${config.entityMock.id}/status/${config.newStatus}`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).patch(link).query({});

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAuthorizedSpy(config.policy);

			const response = await request(app).patch(link).query({});

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'updateStatus').mockResolvedValue(
				undefined,
			);

			const response = await request(app).patch(link).query({});

			try {
				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
			} catch (error) {
				addDebugResponse(
					response,
					`${config.controller} - statusUpdate`,
				);

				throw error; // Re-throw to fail the test
			}
		});
	});
}
