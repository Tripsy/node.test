import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import { NotFoundError } from '@/exceptions';
import { getProductEntityMock } from '@/features/product/product.mock';
import productRoutes from '@/features/product/product.routes';
import { productService } from '@/features/product/product.service';
import productPublicRoutes from '@/features/product/product-public.routes';
import { withDebugResponse } from '@/tests/jest-controller.setup';

let app: Express;

beforeAll(async () => {
	app = await createApp();
});

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'ProductPublicController';
const basePath = (await productPublicRoutes()).basePath;
const adminBasePath = (await productRoutes()).basePath;

/*
 * These routes have no policy call, so the standard 401/403 builders do not apply. What has to be
 * proven instead is that an *unauthenticated* caller is served, and that what a visitor may see is
 * decided by the query rather than by a gate the controller could forget to call.
 */
describe(controller, () => {
	const entity = getProductEntityMock();

	// Both public surfaces answer with the cover image attached (`attachCoverImages`), and the
	// listing also attaches every variant (`attachVariants`), so the mocked service has to return
	// that shape rather than the bare entity
	const publicEntry = { ...entity, cover_image: null, variants: [] };

	it('find should answer an unauthenticated caller', async () => {
		jest.spyOn(productService, 'findByFilterPublic').mockResolvedValue([
			[publicEntry],
			1,
		]);

		const response = await request(app).get(basePath);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.data.entries).toHaveLength(1);
		}, response);
	});

	it('read should answer an unauthenticated caller', async () => {
		jest.spyOn(productService, 'resolvePublicRef').mockResolvedValue(
			entity,
		);
		jest.spyOn(productService, 'getPublicEntryById').mockResolvedValue(
			publicEntry,
		);

		const response = await request(app).get(`${basePath}/pizza-margherita`);

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body.data).toHaveProperty('id', entity.id);
		}, response);
	});

	/*
	 * The slug resolves to an id first, so the cached payload is keyed the way
	 * `cleanEntityCache` invalidates — by `product:<id>*`. A slug-keyed entry would outlive an
	 * edit until its TTL, and the sellable window would be baked into it.
	 */
	it('read should resolve the slug before loading the payload', async () => {
		const resolvePublicRef = jest
			.spyOn(productService, 'resolvePublicRef')
			.mockResolvedValue(entity);

		const getPublicEntryById = jest
			.spyOn(productService, 'getPublicEntryById')
			.mockResolvedValue(publicEntry);

		await request(app).get(`${basePath}/pizza-margherita?language=en`);

		expect(resolvePublicRef).toHaveBeenCalledWith('pizza-margherita', 'en');
		expect(getPublicEntryById).toHaveBeenCalledWith(entity.id, 'en');
	});

	it('read lower-cases and trims the slug before resolving it', async () => {
		const resolvePublicRef = jest
			.spyOn(productService, 'resolvePublicRef')
			.mockResolvedValue(entity);

		jest.spyOn(productService, 'getPublicEntryById').mockResolvedValue(
			publicEntry,
		);

		await request(app).get(`${basePath}/Pizza-Margherita`);

		expect(resolvePublicRef).toHaveBeenCalledWith(
			'pizza-margherita',
			expect.any(String),
		);
	});

	/*
	 * A product outside the sellable window is not addressable here at all — the repository
	 * filter is what decides that, and it answers 404 rather than leaking the product's
	 * existence through a different status code.
	 */
	it('read should answer 404 for a product outside the sellable window', async () => {
		jest.spyOn(productService, 'resolvePublicRef').mockRejectedValue(
			new NotFoundError('product.error.not_found'),
		);

		const response = await request(app).get(`${basePath}/pizza-margherita`);

		withDebugResponse(() => {
			expect(response.status).toBe(404);
		}, response);
	});

	it('find only ever reaches the public listing method', async () => {
		const findByFilterPublic = jest
			.spyOn(productService, 'findByFilterPublic')
			.mockResolvedValue([[], 0]);

		const findByFilter = jest.spyOn(productService, 'findByFilter');

		await request(app).get(basePath);

		expect(findByFilterPublic).toHaveBeenCalled();
		expect(findByFilter).not.toHaveBeenCalled();
	});

	it('does not share a prefix with the authorized routes', () => {
		// The whole reason these live under their own basePath: a slug must never be
		// dispatched to `/products/:id`, and no route-ordering rule should be load-bearing
		expect(basePath.startsWith(`${adminBasePath}/`)).toBe(false);
	});

	it('the authorized listing still rejects an unauthenticated caller', async () => {
		const response = await request(app).get(adminBasePath);

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});
});
