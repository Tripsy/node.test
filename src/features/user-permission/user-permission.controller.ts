import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import { permissionPolicy } from '@/features/permission/permission.policy';
import {
    userPermissionValidator, UserPermissionValidator, UserPermissionValidatorCreateDto, UserPermissionValidatorFindDto,
} from '@/features/user-permission/user-permission.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import asyncHandler from '@/lib/helpers/async.handler';
import {userPermissionService, UserPermissionService} from "@/features/user-permission/user-permission.service";

class UserPermissionController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: UserPermissionValidator,
		private userPermissionService: UserPermissionService,
	) {
		super();
	}

	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate<UserPermissionValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

        const results = await this.userPermissionService.create(data, res.locals.validated.user_id);

		res.locals.output.data(results);
		res.locals.output.message(lang('user-permission.success.update'));

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

        await this.userPermissionService.delete(res.locals.validated.user_id, res.locals.validated.permission_id);

		res.locals.output.message(lang('user-permission.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

        await this.userPermissionService.restore(res.locals.validated.user_id, res.locals.validated.id);

		res.locals.output.message(lang('user-permission.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<UserPermissionValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

        const [entries, total] = await this.userPermissionService.findByFilter(
            data,
            res.locals.validated.user_id,
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

export function createUserPermissionController(deps: {
	policy: PolicyAbstract;
	validator: UserPermissionValidator;
	userPermissionService: UserPermissionService;
}) {
	return new UserPermissionController(
		deps.policy,
		deps.validator,
		deps.userPermissionService,
	);
}

export const userPermissionController = createUserPermissionController({
	policy: permissionPolicy,
	validator: userPermissionValidator,
	userPermissionService: userPermissionService,
});
