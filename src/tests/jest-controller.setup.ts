import { jest } from '@jest/globals';
import request from 'supertest';
import app, { appReady, closeHandler, server } from '@/app';
import { LogDataLevelEnum } from '@/features/log-data/log-data.entity';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { cacheProvider } from '@/lib/providers/cache.provider';

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

// Authorization related
export function notAuthorizedSpy(policy: PolicyAbstract) {
	jest.spyOn(policy, 'isAuthenticated').mockReturnValue(false);
}

export function notAllowedSpy(policy: PolicyAbstract) {
	jest.spyOn(policy, 'isAuthenticated').mockReturnValue(true);
	jest.spyOn(policy, 'isAdmin').mockReturnValue(false);
}

export function authorizedSpy(policy: PolicyAbstract) {
	jest.spyOn(policy, 'isAuthenticated').mockReturnValue(true);
	jest.spyOn(policy, 'isAdmin').mockReturnValue(false);
	jest.spyOn(policy, 'hasPermission').mockReturnValue(true);
}

// Entity related
export function entityDataMock<E>(entity: string): E {
	switch (entity) {
		case 'log-data':
			return {
				id: 1,
				pid: 'yyy',
				request_id: 'xxx',
				category: 'system',
				level: LogDataLevelEnum.ERROR,
				message: 'Lorem ipsum',
				context: undefined,
				created_at: new Date(),
			} as E;

		default:
			return {
				id: 1,
			} as E;
	}
}

// Common tests - Create
type CreateService<DTO, E> = {
	create(data: DTO): Promise<E>;
};

type ControllerCreateType<E, DTO> = {
	controller: string;
	basePath: string;
	mockEntry: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: CreateService<DTO, E>;
	createData: Partial<DTO>;
};

export function testControllerCreate<E, DTO extends object>(
	config: ControllerCreateType<E, DTO>,
) {
	describe(`${config.controller} - create`, () => {
		const link = `${config.basePath}`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).post(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).post(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'create').mockResolvedValue(
				config.mockEntry,
			);

			const response = await request(app)
				.post(link)
				.send(config.createData);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty(
				'id',
				config.mockEntry.id,
			);
		});
	});
}

// Common tests - Read
type ControllerReadType<E> = {
	controller: string;
	basePath: string;
	mockEntry: E & {
		id: number;
	};
	policy: PolicyAbstract;
};

export function testControllerRead<E>(config: ControllerReadType<E>) {
	describe(`${config.controller} - read`, () => {
		const link = `${config.basePath}/1`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).get(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).get(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(cacheProvider, 'get').mockImplementation(
				async (_key, _fallback) => {
					return config.mockEntry;
				},
			);

			const response = await request(app).get(link).send();

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty(
				'id',
				config.mockEntry.id,
			);
		});
	});
}

// Common tests - Update
type UpdateService<DTO, E> = {
	updateData(
		id: number,
		data: DTO,
		withDeleted: boolean,
	): Promise<Partial<E>>;
};

type ControllerUpdateType<E, DTO> = {
	controller: string;
	basePath: string;
	mockEntry: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: UpdateService<DTO, E>;
	updateData: Partial<DTO>;
};

export function testControllerUpdate<E, DTO extends object>(
	config: ControllerUpdateType<E, DTO>,
) {
	describe(`${config.controller} - update`, () => {
		const link = `${config.basePath}/1`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).put(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).put(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'updateData').mockResolvedValue(
				config.mockEntry,
			);

			const response = await request(app)
				.put(link)
				.send(config.updateData);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data).toHaveProperty(
				'id',
				config.mockEntry.id,
			);
		});
	});
}

// Common tests - Delete
type DeleteMultipleService<DTO> = {
	delete(data: DTO): Promise<number>;
};

type ControllerDeleteMultipleType<DTO> = {
	controller: string;
	basePath: string;
	policy: PolicyAbstract;
	service: DeleteMultipleService<DTO>;
};

export function testControllerDeleteMultiple<DTO>(
	config: ControllerDeleteMultipleType<DTO>,
) {
	describe(`${config.controller} - delete`, () => {
		const link = `${config.basePath}`;

		const testData = {
			ids: [3, 4],
		};

		it('should fail if not authenticated', async () => {
			const response = await request(app).delete(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).delete(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'delete').mockResolvedValue(3);

			const response = await request(app).delete(link).send(testData);

			expect(response.status).toBe(200);
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
			const response = await request(app).delete(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).delete(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'delete').mockResolvedValue();

			const response = await request(app).delete(link).send();

			expect(response.status).toBe(200);
		});
	});
}

// Common tests - Restore
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
			const response = await request(app).patch(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).patch(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'restore').mockResolvedValue();

			const response = await request(app).patch(link).send();

			expect(response.status).toBe(200);
		});
	});
}

// Common tests - Find
type BaseFindQuery = {
	page: number;
	limit: number;
	order_by: string;
	direction: 'ASC' | 'DESC';
};

export function findQueryMock<T extends BaseFindQuery>(
	data: Omit<Partial<T>, keyof BaseFindQuery>,
): T {
	return {
		page: 1,
		limit: 2,
		order_by: 'id',
		direction: 'DESC',
		...data,
	} as T;
}

type FindService<DTO, E> = {
	findByFilter(data: DTO, withDeleted: boolean): Promise<[E[], number]>;
};

type ControllerFindType<DTO, E> = {
	controller: string;
	basePath: string;
	mockEntry: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: FindService<DTO, E>;
	filterData: Partial<DTO>;
};

export function testControllerFind<E, DTO extends BaseFindQuery>(
	config: ControllerFindType<DTO, E>,
) {
	describe(`${config.controller} - find`, () => {
		const link = `${config.basePath}`;

		const mockQuery = findQueryMock<DTO>(config.filterData);

		it('failed validation', async () => {
			authorizedSpy(config.policy);

			const response = await request(app).get(link).query({});

			expect(response.status).toBe(400);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'findByFilter').mockResolvedValue([
				[config.mockEntry],
				1,
			]);

			const response = await request(app).get(link).query(mockQuery);

			expect(response.status).toBe(200);
			expect(response.body.data.entries).toHaveLength(1);
			expect(response.body.data.query.limit).toBe(mockQuery.limit);
		});
	});
}

// Common tests - Update
type StatusUpdateService<E> = {
	updateStatus(
		id: number,
		status: string,
		withDeleted: boolean,
	): Promise<Partial<E>>;
};

type ControllerStatusUpdateType<E> = {
	controller: string;
	basePath: string;
	mockEntry: E & {
		id: number;
	};
	policy: PolicyAbstract;
	service: StatusUpdateService<E>;
	newStatus: string;
};

export function testControllerStatusUpdate<E>(
	config: ControllerStatusUpdateType<E>,
) {
	describe(`${config.controller} - statusUpdate`, () => {
		const link = `${config.basePath}/${config.mockEntry.id}/status/${config.newStatus}`;

		it('should fail if not authenticated', async () => {
			const response = await request(app).patch(link).send();

			expect(response.status).toBe(401);
		});

		it("should fail if it doesn't have proper permission", async () => {
			notAllowedSpy(config.policy);

			const response = await request(app).patch(link).send();

			expect(response.status).toBe(403);
		});

		it('should return success', async () => {
			authorizedSpy(config.policy);

			jest.spyOn(config.service, 'updateStatus').mockResolvedValue(
				config.mockEntry,
			);

			const response = await request(app).patch(link).send();

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		});
	});
}
