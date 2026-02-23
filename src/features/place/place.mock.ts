import type PlaceEntity from '@/features/place/place.entity';
import { PlaceTypeEnum } from '@/features/place/place.entity';
import {
	OrderByEnum,
	type PlaceValidator,
} from '@/features/place/place.validator';
import { createPastDate } from '@/helpers';
import { createValidatorPayloads } from '@/helpers/mock.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export function getPlaceEntityMock(): PlaceEntity {
	return {
		id: 1,
		type: PlaceTypeEnum.COUNTRY,
		parent_id: undefined,
		code: 'RO',
		created_at: createPastDate(86400),
		updated_at: null,
		deleted_at: null,
		children: [],
		contents: [],
	};
}

export const placeInputPayloads = createValidatorPayloads<
	PlaceValidator,
	'create' | 'update' | 'find'
>({
	create: {
		type: PlaceTypeEnum.COUNTRY,
		code: 'RO',
		content: [
			{
				language: 'en',
				name: 'Romania',
				type_label: 'Country',
			},
		],
	},
	update: {
		type: PlaceTypeEnum.COUNTRY,
		code: 'RO',
		content: [
			{
				language: 'en',
				name: 'Romania',
				type_label: 'Country',
			},
		],
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'roma',
			type: PlaceTypeEnum.COUNTRY,
			language: 'en',
			is_deleted: false,
		},
	},
});

export const placeOutputPayloads = createValidatorPayloads<
	PlaceValidator,
	'create' | 'update' | 'find'
>({
	create: {
		type: PlaceTypeEnum.COUNTRY,
		code: 'RO',
		content: [
			{
				language: 'en',
				name: 'Romania',
				type_label: 'Country',
			},
		],
	},
	update: {
		type: PlaceTypeEnum.COUNTRY,
		code: 'RO',
		content: [
			{
				language: 'en',
				name: 'Romania',
				type_label: 'Country',
			},
		],
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			term: 'roma',
			type: PlaceTypeEnum.COUNTRY,
			language: 'en',
			is_deleted: false,
		},
	},
});
