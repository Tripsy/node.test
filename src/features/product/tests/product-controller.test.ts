import { jest } from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '@/app';
import type ProductEntity from '@/features/product/product.entity';
import { ProductWorkflowEnum } from '@/features/product/product.entity';
import {
	getProductEntityMock,
	productInputPayloads,
} from '@/features/product/product.mock';
import { productPolicy } from '@/features/product/product.policy';
import productRoutes from '@/features/product/product.routes';
import { productService } from '@/features/product/product.service';
import type { ProductValidator } from '@/features/product/product.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdateWithContent,
	withDebugResponse,
} from '@/tests/jest-controller.setup';
import { authorizedSpy, notAuthorizedSpy } from '@/tests/mocks/policies.mock';

let app: Express;

beforeAll(async () => {
	app = await createApp();
});

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'ProductController';
const basePath = (await productRoutes()).basePath;
const entityId = getProductEntityMock().id;

testControllerCreate<ProductEntity, ProductValidator>({
	controller: controller,
	route: basePath,
	entityMock: getProductEntityMock(),
	policy: productPolicy,
	service: productService,
	createData: productInputPayloads.create,
});

testControllerUpdateWithContent<ProductEntity, ProductValidator>({
	controller: controller,
	route: `${basePath}/${entityId}`,
	entityMock: getProductEntityMock(),
	policy: productPolicy,
	service: productService,
	updateData: productInputPayloads.update,
});

testControllerRead<ProductEntity>({
	controller: controller,
	route: `${basePath}/${entityId}`,
	entityMock: getProductEntityMock(),
	policy: productPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${entityId}`,
	policy: productPolicy,
	service: productService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${entityId}/restore`,
	policy: productPolicy,
	service: productService,
});

testControllerFind<ProductEntity, ProductValidator>({
	controller: controller,
	route: basePath,
	entityMock: getProductEntityMock(),
	policy: productPolicy,
	service: productService,
	findData: productInputPayloads.find,
});

/*
 * Its own block rather than `testControllerStatusUpdate`: the shared builder drives
 * `updateStatus`, and a product carries two statuses. This one is the editorial `workflow`;
 * `sale_status` has no route at all, because it is derived from the availability timestamps
 * `update` is where an editor changes.
 */
describe(`${controller} - workflowUpdate`, () => {
	const route = `${basePath}/${entityId}/workflow/${ProductWorkflowEnum.PENDING_REVIEW}`;

	it('should fail if not authenticated', async () => {
		const response = await request(app).patch(route).query({});

		withDebugResponse(() => {
			expect(response.status).toBe(401);
		}, response);
	});

	it("should fail if it doesn't have proper permission", async () => {
		notAuthorizedSpy(productPolicy);

		const response = await request(app).patch(route).query({});

		withDebugResponse(() => {
			expect(response.status).toBe(403);
		}, response);
	});

	it('should return success', async () => {
		authorizedSpy(productPolicy);

		jest.spyOn(productService, 'findById').mockResolvedValue(
			getProductEntityMock(),
		);
		jest.spyOn(productService, 'updateWorkflow').mockResolvedValue(
			undefined,
		);

		const response = await request(app).patch(route).query({});

		withDebugResponse(() => {
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(productService.updateWorkflow).toHaveBeenCalledWith(
				expect.objectContaining({ id: entityId }),
				ProductWorkflowEnum.PENDING_REVIEW,
			);
		}, response);
	});

	/*
	 * The route-level guard, which runs ahead of the controller and its validator — hence a
	 * 400 rather than the 422 a schema failure produces.
	 */
	it('should reject a workflow value outside the enum', async () => {
		authorizedSpy(productPolicy);

		const response = await request(app)
			.patch(`${basePath}/${entityId}/workflow/sold-out`)
			.query({});

		withDebugResponse(() => {
			expect(response.status).toBe(400);
		}, response);
	});
});
