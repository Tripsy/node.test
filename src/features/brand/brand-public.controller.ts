import type { Request, Response } from 'express';
import {
	type BrandService,
	brandService,
} from '@/features/brand/brand.service';
import { BrandValidator } from '@/features/brand/brand.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

class BrandPublicController extends BaseController {
	constructor(
		private validator: BrandValidator,
		private brandService: BrandService,
	) {
		super();
	}

	public find = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.publicFind, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] =
			await this.brandService.findByFilterPublic(data);

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

export const brandPublicController = new BrandPublicController(
	new BrandValidator('brand'),
	brandService,
);
