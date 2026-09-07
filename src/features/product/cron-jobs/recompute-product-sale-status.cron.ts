import { ProductSaleStatusEnum } from '@/features/product/product.entity';
import { getProductRepository } from '@/features/product/product.repository';
import { productService } from '@/features/product/product.service';

export const SCHEDULE_EXPRESSION = '25 */3 * * *';
export const EXPECTED_RUN_TIME = 5; // seconds

/**
 * Moves products onto the `sale_status` their availability timestamps imply.
 *
 * `sale_status` is derived, so the write paths already compute it — this run is what moves a
 * product as time passes rather than as it is edited. Nothing waits on it: no read path trusts
 * the column, `ProductQuery.filterBySellable` compares the timestamps itself, so a product whose
 * window opened a minute ago is already listed and this only catches the column up.
 *
 * Every three hours rather than nightly, because what the column still drives is the dashboard's
 * badge and its status facet — a stale one there reads as a bug to whoever is looking at it. The
 * candidate set is a seek on the two partial indexes and drains as it goes, so a shorter period
 * costs a near-empty scan rather than more work. The minute is offset off the hour and off the
 * other jobs' minutes: the crons share a process, and a 4g container is not the place to run
 * several at once.
 *
 * The candidates are the rows carrying a deadline that has passed — which is what the two partial
 * indexes on `product` are built for — **and** whose stored `sale_status` disagrees with what
 * those timestamps imply. Both halves are needed: the first is what the planner can seek on, and
 * the second is what makes the set drain. On the deadline alone every row that has ever opened or
 * closed stays a candidate for good, so past the page size the same rows would be re-examined
 * on every pass and the ones behind them never reached.
 *
 * The `CASE` mirrors `ProductService.resolveSaleStatus` and has to keep mirroring it — the branch
 * order is the precedence, and `discontinued_at` outranks both windows. Compared as `text`
 * because `sale_status` is a Postgres enum and the bound parameters arrive untyped.
 *
 * Saved one at a time through the service so each write is audited and its cache dropped — the
 * same reason the article crons do.
 */
const recomputeProductSaleStatus = async () => {
	const now = new Date().toISOString();

	const entries = await getProductRepository()
		.createQuery()
		.filterRaw(
			`(
				(product.available_from IS NOT NULL AND product.available_from <= :now)
				OR (product.available_until IS NOT NULL AND product.available_until <= :now)
				OR (product.discontinued_at IS NOT NULL AND product.discontinued_at <= :now)
			)`,
			{ now },
		)
		.filterRaw(
			`product.sale_status::text <> CASE
				WHEN product.discontinued_at IS NOT NULL AND product.discontinued_at <= :now
					THEN :discontinued
				WHEN product.available_from IS NOT NULL AND product.available_from > :now
					THEN :comingSoon
				WHEN product.available_until IS NOT NULL AND product.available_until <= :now
					THEN :unavailable
				ELSE :available
			END`,
			{
				now,
				discontinued: ProductSaleStatusEnum.DISCONTINUED,
				comingSoon: ProductSaleStatusEnum.COMING_SOON,
				unavailable: ProductSaleStatusEnum.UNAVAILABLE,
				available: ProductSaleStatusEnum.AVAILABLE,
			},
		)
		.orderBy('id')
		.pagination(1, 200)
		.all();

	let recomputed = 0;

	for (const entry of entries) {
		if (await productService.recomputeSaleStatus(entry)) {
			recomputed++;
		}
	}

	return {
		scanned: entries.length,
		recomputed,
	};
};

export default recomputeProductSaleStatus;
