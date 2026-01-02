import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import TemplateEntity, {
	TemplateTypeEnum,
} from '@/features/template/template.entity';
import { getTemplateRepository } from '@/features/template/template.repository';
import {
	TemplateCreateValidator,
	TemplateFindValidator,
	TemplateUpdateValidator,
} from '@/features/template/template.validator';
import { BadRequestError, CustomError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {cacheProvider, type CacheProvider} from '@/lib/providers/cache.provider';
import {BaseController} from "@/lib/abstracts/controller.abstract";
import type PolicyAbstract from "@/lib/abstracts/policy.abstract";

class TemplateController extends BaseController {
    constructor(
        private policy: PolicyAbstract,
        private validator: ITemplateValidator,
        private cache: CacheProvider,
        private templateService: ITemplateService,
    ) {
        super();
    }
    
	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const validated = TemplateCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingTemplate = await getTemplateRepository()
			.createQuery()
			.filterBy('label', validated.data.label)
			.filterBy('language', validated.data.language)
			.filterBy('type', validated.data.type)
			.withDeleted(this.policy.allowDeleted(res.locals.auth))
			.first();

		if (existingTemplate) {
			throw new CustomError(409, lang('template.error.already_exists'));
		}

		const template = new TemplateEntity();
		template.label = validated.data.label;
		template.language = validated.data.language;
		template.type = validated.data.type;
		template.content = validated.data.content;

		const entry: TemplateEntity =
			await getTemplateRepository().save(template);

		res.locals.output.data(entry);
		res.locals.output.message(lang('template.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = cacheProvider.buildKey(
			TemplateEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const template = await cacheProvider.get(cacheKey, async () => {
			return getTemplateRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(this.policy.allowDeleted(res.locals.auth))
				.firstOrFail();
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(template);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const validated = TemplateUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const template = await getTemplateRepository()
			.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const existingTemplate = await getTemplateRepository()
			.createQuery()
			.filterBy('id', res.locals.validated.id, '!=')
			.filterBy('label', validated.data.label || template.label)
			.filterBy('language', validated.data.language || template.language)
			.filterBy('type', validated.data.type)
			.withDeleted(this.policy.allowDeleted(res.locals.auth))
			.first();

		// Return error if the template already exists
		if (existingTemplate) {
			throw new CustomError(409, lang('template.error.already_exists'));
		}

		const updatedEntity: Partial<TemplateEntity> = {
			id: template.id,
			...(Object.fromEntries(
				Object.entries(validated.data).filter(([key]) =>
					paramsUpdateList.includes(key as keyof TemplateEntity),
				),
			) as Partial<TemplateEntity>),
		};

		await getTemplateRepository().save(updatedEntity);

		res.locals.output.message(lang('template.success.update'));
		res.locals.output.data(updatedEntity);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await getTemplateRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('template.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await getTemplateRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('template.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const validated = TemplateFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const [entries, total] = await getTemplateRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterBy('language', validated.data.filter.language)
			.filterBy('type', validated.data.filter.type)
			.filterByTerm(validated.data.filter.term)
			.withDeleted(
				this.policy.allowDeleted(res.locals.auth) &&
					validated.data.filter.is_deleted,
			)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.locals.output);
	});

	public readPage = asyncHandler(async (_req: Request, res: Response) => {
		const cacheKey = cacheProvider.buildKey(
			TemplateEntity.NAME,
			res.locals.validated.label,
			'read',
		);

		const template = await cacheProvider.get(cacheKey, async () => {
			return getTemplateRepository()
				.createQuery()
				.filterBy('label', res.locals.validated.label)
				.filterBy('language', res.locals.lang)
				.filterBy('type', TemplateTypeEnum.PAGE)
				.firstOrFail();
		});

		res.locals.output.meta(res.locals.outputder.isCached, 'isCached');
		res.locals.output.data(template);

		res.json(res.locals.output);
	});
}

export function createTemplateController(deps: {
    policy: PolicyAbstract;
    validator: ITemplateValidator;
    cache: CacheProvider;
    templateService: ITemplateService;
}) {
    return new TemplateController(
        deps.policy,
        deps.validator,
        deps.cache,
        deps.templateService,
    );
}

export const templateController = createTemplateController({
    policy: templatePolicy,
    validator: templateValidator,
    cache: cacheProvider,
    templateService: templateService,
});
