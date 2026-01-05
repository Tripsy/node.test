import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import LogDataEntity from '@/features/log-data/log-data.entity';
import { logDataPolicy } from '@/features/log-data/log-data.policy';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';
import {
    logDataValidator,
    LogDataValidator,
    LogDataValidatorDeleteDto,
    LogDataValidatorFindDto
} from "@/features/log-data/log-data.validator";
import {logDataService, LogDataService} from "@/features/log-data/log-data.service";

class LogDataController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: LogDataValidator,
		private cache: CacheProvider,
		private logDataService: LogDataService,
	) {
		super();
	}

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			LogDataEntity.NAME,
			res.locals.id,
			'read',
		);

        const entry = await this.cache.get(cacheKey, async () =>
            this.logDataService.findById(res.locals.id),
        );        

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

    public delete = asyncHandler(async (req: Request, res: Response) => {
        this.policy.canDelete(res.locals.auth);

        const data = this.validate<LogDataValidatorDeleteDto>(
            this.validator.delete(),
            req.body,
            res,
        );

        const countDelete = await this.logDataService.delete(data);

        if (countDelete === 0) {
            res.status(204).locals.output.message(
                lang('shared.error.db_delete_zero'),
            ); // Note: By API design the response message is actually not displayed for 204
        } else {
            res.locals.output.message(lang('log-data.success.delete'));
        }

        res.json(res.locals.output);
    });

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<LogDataValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

        const [entries, total] =
            await this.logDataService.findByFilter(data);

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

export function createLogDataController(deps: {
	policy: PolicyAbstract;
	validator: LogDataValidator;
	cache: CacheProvider;
	logDataService: LogDataService;
}) {
	return new LogDataController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.logDataService,
	);
}

export const logDataController = createLogDataController({
	policy: logDataPolicy,
	validator: logDataValidator,
	cache: cacheProvider,
	logDataService: logDataService,
});
