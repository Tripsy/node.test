import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import TemplateRepository, {TemplateQuery} from '../repositories/template.repository';
import TemplateEntity from '../entities/template.entity';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import CustomError from '../exceptions/custom.error';
import {getCacheProvider} from '../providers/cache.provider';
import TemplatePolicy from '../policies/template.policy';
import TemplateCreateValidator from '../validators/template-create.validator';
import TemplateUpdateValidator from '../validators/template-update.validator';
import {paramsUpdateList} from '../validators/template-update.validator';
import TemplateFindValidator from '../validators/template-find.validator';

class TemplateController {
    public create = asyncHandler(async (req: Request, res: Response) => {
        const policy = new TemplatePolicy(req);

        // Check permission (admin or operator with permission)
        policy.create();

        // Validate the request body against the schema
        const validated = TemplateCreateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const existingTemplate = await TemplateRepository.createQuery()
            .filterBy('label', validated.data.label)
            .filterBy('language', validated.data.language)
            .filterBy('type', validated.data.type)
            .withDeleted(policy.allowDeleted())
            .first();

        if (existingTemplate) {
            throw new CustomError(409, lang('template.error.already_exists'));
        }

        const template = new TemplateEntity();
        template.label = validated.data.label;
        template.language = validated.data.language;
        template.type = validated.data.type;
        template.content = validated.data.content;

        // Set `contextData` for usage in subscriber
        template.contextData = {
            auth_id: policy.getUserId()
        };

        const entry: TemplateEntity = await TemplateRepository.save(template);

        res.output.data(entry);
        res.output.message(lang('template.success.create'));

        res.status(201).json(res.output);
    });

    public read = asyncHandler(async (req: Request, res: Response) => {
        const policy = new TemplatePolicy(req);

        // Check permission (admin or operator with permission)
        policy.read();

        const cacheProvider = getCacheProvider();

        const cacheKey = cacheProvider.buildKey(TemplateQuery.entityAlias, res.locals.validated.id, 'read');
        const template = await cacheProvider.get(cacheKey, async () => {
            return TemplateRepository
                .createQuery()
                .filterById(res.locals.validated.id)
                .withDeleted(policy.allowDeleted())
                .firstOrFail();
        });

        res.output.meta(cacheProvider.isCached, 'isCached');
        res.output.data(template);

        res.json(res.output);
    });

    public update = asyncHandler(async (req: Request, res: Response) => {
        const policy = new TemplatePolicy(req);

        // Check permission (admin or operator with permission)
        policy.update();

        // Validate the request body against the schema
        const validated = TemplateUpdateValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const template = await TemplateRepository.createQuery()
            .select(paramsUpdateList)
            .filterById(res.locals.validated.id)
            .firstOrFail();

        const existingTemplate = await TemplateRepository.createQuery()
            .filterBy('id', res.locals.validated.id, '!=')
            .filterBy('label', validated.data.label || template.label)
            .filterBy('language', validated.data.language || template.language)
            .filterBy('type', validated.data.type)
            .withDeleted(policy.allowDeleted())
            .first();

        // Return error if template already exist
        if (existingTemplate) {
            throw new CustomError(409, lang('template.error.already_exists'));
        }

        // Create a new object with only allowed fields
        const updatedTemplate: Partial<TemplateEntity> = {
            id: template.id
        };

        for (const key in validated.data) {
            // We allow update only for the fields used in the select
            if (paramsUpdateList.includes(key)) {
                (updatedTemplate as Record<string, any>)[key] = (validated.data as Record<string, any>)[key];
            }
        }

        // Set `contextData` for usage in subscriber
        updatedTemplate.contextData = {
            auth_id: policy.getUserId()
        };

        await TemplateRepository.save(updatedTemplate);

        res.output.message(lang('template.success.update'));
        res.output.data(template);

        res.json(res.output);
    });

    public delete = asyncHandler(async (req: Request, res: Response) => {
        const policy = new TemplatePolicy(req);

        // Check permission (admin or operator with permission)
        policy.delete();

        await TemplateRepository.createQuery()
            .filterById(res.locals.validated.id)
            .setContextData({
                auth_id: policy.getUserId()
            })
            .delete();

        res.output.message(lang('template.success.delete'));

        res.json(res.output);
    });

    public restore = asyncHandler(async (req: Request, res: Response) => {
        const policy = new TemplatePolicy(req);

        // Check permission (admin or operator with permission)
        policy.restore();

        await TemplateRepository.createQuery()
            .filterById(res.locals.validated.id)
            .setContextData({
                auth_id: policy.getUserId()
            })
            .restore();

        res.output.message(lang('template.success.restore'));

        res.json(res.output);
    });

    public find = asyncHandler(async (req: Request, res: Response) => {
        const policy = new TemplatePolicy(req);

        // Check permission (admin or operator with permission)
        policy.find();

        // Validate the request body against the schema
        const validated = TemplateFindValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const [entries, total] = await TemplateRepository.createQuery()
            .filterById(validated.data.filter.id)
            .filterBy('label', validated.data.filter.label, 'LIKE')
            .filterBy('language', validated.data.filter.language)
            .filterBy('type', validated.data.filter.type)
            .filterBy('content', validated.data.filter.content, 'LIKE')
            .withDeleted(policy.allowDeleted() && validated.data.filter.is_deleted)
            .orderBy(validated.data.order_by, validated.data.direction)
            .pagination(validated.data.page, validated.data.limit)
            .all(true);

        res.output.data({
            entries: entries,
            pagination: {
                page: validated.data.page,
                limit: validated.data.limit,
                total: total,
                totalPages: Math.ceil(total / validated.data.limit)
            },
            query: validated.data
        });

        res.json(res.output);
    });
}

export default new TemplateController();
