import { expect, jest } from '@jest/globals';
import cron from 'node-cron';
import type ProductEntity from '@/features/product/product.entity';
import { getProductEntityMock } from '@/features/product/product.mock';
import type { ProductQuery } from '@/features/product/product.repository';
import { createMockQuery } from '@/tests/jest-service.setup';

/*
 * Same shape as `log-data-cron-jobs.test.ts`: the job resolves its repository through
 * `dataSource.getRepository(...)`, which is never initialized under `test`, so the repository
 * and the service are both replaced before the job is imported - under the ESM preset that
 * means `unstable_mockModule` plus a dynamic import.
 */
const productQuery = createMockQuery() as unknown as jest.Mocked<ProductQuery>;

const recomputeSaleStatus =
	jest.fn<(entry: ProductEntity) => Promise<boolean>>();

jest.unstable_mockModule('@/features/product/product.repository', () => ({
	getProductRepository: () => ({
		createQuery: () => productQuery,
	}),
}));

jest.unstable_mockModule('@/features/product/product.service', () => ({
	productService: { recomputeSaleStatus },
}));

const recomputeProductSaleStatus = await import(
	'@/features/product/cron-jobs/recompute-product-sale-status.cron'
);

/** Every condition the job built, whitespace collapsed so the SQL can be matched as one line. */
const conditions = (): string[] =>
	productQuery.filterRaw.mock.calls.map(([sql]) =>
		String(sql).replace(/\s+/g, ' ').trim(),
	);

describe('product cron jobs', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		productQuery.all.mockResolvedValue([] as never);
	});

	describe('recompute-product-sale-status module contract', () => {
		it('should default-export a function', () => {
			expect(typeof recomputeProductSaleStatus.default).toBe('function');
		});

		it('should export a cron expression node-cron accepts', () => {
			expect(typeof recomputeProductSaleStatus.SCHEDULE_EXPRESSION).toBe(
				'string',
			);
			expect(
				cron.validate(recomputeProductSaleStatus.SCHEDULE_EXPRESSION),
			).toBe(true);
		});

		it('should export a numeric EXPECTED_RUN_TIME', () => {
			expect(typeof recomputeProductSaleStatus.EXPECTED_RUN_TIME).toBe(
				'number',
			);
			expect(
				recomputeProductSaleStatus.EXPECTED_RUN_TIME,
			).toBeGreaterThan(0);
		});
	});

	/*
	 * The candidate set has to be self-draining. On the elapsed-deadline predicate alone every
	 * row that has ever opened or closed stays a candidate for good, so past the page size the
	 * same rows are re-examined every night and the ones behind them are never reached.
	 */
	describe('the candidate set drains', () => {
		it('narrows to the rows whose stored status disagrees with the timestamps', async () => {
			await recomputeProductSaleStatus.default();

			expect(
				conditions().some((condition) =>
					condition.includes('product.sale_status::text <> CASE'),
				),
			).toBe(true);
		});

		it('keeps the elapsed-deadline predicate the partial indexes serve', async () => {
			await recomputeProductSaleStatus.default();

			expect(
				conditions().some(
					(condition) =>
						condition.includes(
							'product.available_from IS NOT NULL',
						) &&
						condition.includes(
							'product.discontinued_at IS NOT NULL',
						),
				),
			).toBe(true);
		});

		/*
		 * The `CASE` mirrors `ProductService.resolveSaleStatus`, where the branch order *is* the
		 * precedence - `discontinued_at` outranks both windows, and an unopened product reads as
		 * coming soon rather than unavailable. Reordering the SQL silently changes which status a
		 * product carrying two elapsed timestamps lands on.
		 */
		it('orders the CASE the way resolveSaleStatus does', async () => {
			await recomputeProductSaleStatus.default();

			const [condition] = conditions().filter((entry) =>
				entry.includes('CASE'),
			);

			const discontinued = condition.indexOf('discontinued_at IS NOT');
			const comingSoon = condition.indexOf('available_from IS NOT');
			const unavailable = condition.indexOf('available_until IS NOT');

			expect(discontinued).toBeGreaterThan(-1);
			expect(comingSoon).toBeGreaterThan(discontinued);
			expect(unavailable).toBeGreaterThan(comingSoon);
			expect(condition).toContain('ELSE :available');
		});

		// Ordered so a run that hits the cap resumes where the last one stopped rather than
		// re-reading an arbitrary page
		it('reads one ordered, capped page', async () => {
			await recomputeProductSaleStatus.default();

			expect(productQuery.orderBy).toHaveBeenCalledWith('id');
			expect(productQuery.pagination).toHaveBeenCalledWith(1, 200);
		});
	});

	describe('recomputeProductSaleStatus', () => {
		it('saves each candidate through the service and counts the changes', async () => {
			const changed = getProductEntityMock();
			const unchanged = getProductEntityMock();

			productQuery.all.mockResolvedValue([changed, unchanged] as never);

			recomputeSaleStatus
				.mockResolvedValueOnce(true)
				.mockResolvedValueOnce(false);

			const result = await recomputeProductSaleStatus.default();

			expect(recomputeSaleStatus).toHaveBeenCalledTimes(2);
			expect(recomputeSaleStatus).toHaveBeenCalledWith(changed);

			// `scanned` counts the page, `recomputed` only the rows the service moved
			expect(result).toEqual({ scanned: 2, recomputed: 1 });
		});

		it('reports an empty run when nothing has drifted', async () => {
			const result = await recomputeProductSaleStatus.default();

			expect(recomputeSaleStatus).not.toHaveBeenCalled();
			expect(result).toEqual({ scanned: 0, recomputed: 0 });
		});
	});
});
