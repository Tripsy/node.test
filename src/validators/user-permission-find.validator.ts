import { z } from 'zod';
import { lang } from '../config/i18n-setup.config';
import { cfg } from '../config/settings.config';
import { OrderDirectionEnum } from '../enums/order-direction.enum';
import BadRequestError from '../exceptions/bad-request.error';
import { parseJsonFilter } from '../helpers/utils.helper';

enum UserPermissionOrderByEnum {
	ID = 'id',
	PERMISSION_ID = 'permission_id',
	ENTITY = 'permission.entity',
	OPERATION = 'permission.operation',
}

const UserPermissionFindValidator = z.object({
	order_by: z
		.nativeEnum(UserPermissionOrderByEnum)
		.optional()
		.default(UserPermissionOrderByEnum.ID),
	direction: z
		.nativeEnum(OrderDirectionEnum)
		.optional()
		.default(OrderDirectionEnum.ASC),
	limit: z.coerce
		.number({ message: lang('error.invalid_number') })
		.min(1)
		.optional()
		.default(cfg('filter.limit') as number),
	page: z.coerce
		.number({ message: lang('error.invalid_number') })
		.min(1)
		.optional()
		.default(1),
	filter: z
		.preprocess(
			(val) =>
				parseJsonFilter(val, () => {
					throw new BadRequestError(lang('error.invalid_filter'));
				}),
			z.object({
				user_id: z.coerce
					.number({ message: lang('error.invalid_number') })
					.optional(),
				entity: z
					.string({ message: lang('error.invalid_string') })
					.min(cfg('filter.termMinLength') as number, {
						message: lang('error.string_min', {
							min: cfg('filter.termMinLength') as string,
							field: 'entity',
						}),
					})
					.optional(),
				operation: z
					.string({ message: lang('error.invalid_string') })
					.min(cfg('filter.termMinLength') as number, {
						message: lang('error.string_min', {
							min: cfg('filter.termMinLength') as string,
							field: 'operation',
						}),
					})
					.optional(),
				is_deleted: z
					.preprocess(
						(val) => val === 'true' || val === true,
						z.boolean({ message: lang('error.invalid_boolean') }),
					)
					.default(false),
			}),
		)
		.optional()
		.default({
			user_id: undefined,
			entity: undefined,
			operation: undefined,
			is_deleted: false,
		}),
});

export default UserPermissionFindValidator;
