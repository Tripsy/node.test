import type { Request, Response } from 'express';
import {
	type ProductVariantPolicy,
	productVariantPolicy,
} from '@/features/product/product-variant.policy';
import {
	type ProductVariantService,
	productVariantService,
} from '@/features/product/product-variant.service';
import { ProductVariantValidator } from '@/features/product/product-variant.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The catalog listing seen from the thing that is actually sold.
 *
 * `find` is the whole surface. A variant is created and withdrawn through its product's payload,
 * where `syncVariants` replaces the set as a whole and the validator enforces the rules that hold
 * across it — exactly one default, no duplicate SKU. A write route here would bypass both.
 */
class ProductVariantController extends BaseController {
	constructor(
		private policy: ProductVariantPolicy,
		private validator: ProductVariantValidator,
		private productVariantService: ProductVariantService,
	) {
		super();
	}

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate(this.validator.find, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] = await this.productVariantService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});
}

export const productVariantController = new ProductVariantController(
	productVariantPolicy,
	new ProductVariantValidator('product'),
	productVariantService,
);
