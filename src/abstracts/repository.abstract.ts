import {
	Brackets,
	type ObjectLiteral,
	type QueryBuilder,
	type SelectQueryBuilder,
} from 'typeorm';
import type { Repository } from 'typeorm/repository/Repository';
import {
	type EntityContextData,
	OrderDirectionEnum,
} from '@/abstracts/entity.abstract';
import { lang } from '@/config/i18n.setup';
import CustomError from '@/exceptions/custom.error';
import NotFoundError from '@/exceptions/not-found.error';
import { formatDate } from '@/helpers/date.helper';

type QueryValue = string | number | (string | number)[];
type QueryParams = Record<string, QueryValue>;

type FilterByPropsType = {
	column: string;
	value?: QueryValue | null;
	operator: string;
};

class RepositoryAbstract<TEntity extends ObjectLiteral> {
	private repository: Repository<TEntity>;
	protected entityAlias: string;
	protected query: SelectQueryBuilder<TEntity>;
	protected hasFilter: boolean = false; // Flag used to signal if query builder filters have been applied in preparation for delete operations
	protected hasGroup: boolean = false; // Flag used to signal if query builder groups have been applied
	protected contextData: EntityContextData | undefined;

	constructor(repository: Repository<TEntity>, entityAlias: string) {
		this.repository = repository;
		this.entityAlias = entityAlias;
		this.query = repository.createQueryBuilder(this.entityAlias);
	}

	debugSql(): string {
		return this.query.getSql();
	}

	debugParameters(): ObjectLiteral {
		return this.query.getParameters();
	}

	debug(): this {
		console.log('SQL:', this.query.getSql());
		console.log('Parameters:', this.query.getParameters());

		return this;
	}

	setContextData(data: EntityContextData): this {
		this.contextData = data;

		return this;
	}

	getContextData(): EntityContextData | undefined {
		return this.contextData;
	}

	/**
	 * entityOrProperty:
	 *       Entity name = user_permission.permission
	 *       Property name = permission (condition is required)
	 *       Entity class = UserPermission
	 *       Callback function that returns a query builder for subqueries (condition is required)
	 *
	 * @param entityOrProperty
	 * @param alias
	 * @param type
	 * @param condition
	 */
	join(
		entityOrProperty: string,
		alias: string,
		type: 'INNER' | 'LEFT' = 'INNER',
		condition?: string,
	): this {
		switch (type) {
			case 'INNER':
				this.query.innerJoin(entityOrProperty, alias, condition);
				break;
			case 'LEFT':
				this.query.leftJoin(entityOrProperty, alias, condition);
				break;
		}

		return this;
	}

	/**
	 * Note: Without primaryKey TypeORM won’t map the entity correctly.
	 *
	 * ex: ['user.id', 'user.name', 'user.email', 'user.status', 'user.created_at', 'user.updated_at']
	 * ex: ['id', 'name', 'email', 'status', 'created_at', 'updated_at']
	 */
	select(fields: string[], autoAppendId: boolean = true): this {
		if (autoAppendId) {
			// Define possible primary key variations
			const primaryKeys = [`${this.entityAlias}.id`, 'id'];

			// Check if either 'id' or 'user.id' is already included
			const hasPrimaryKey = fields.some((field) =>
				primaryKeys.includes(field),
			);

			// If not present, add the fully qualified primary key
			if (!hasPrimaryKey) {
				fields.unshift(`${this.entityAlias}.id`);
			}
		}

		this.query.select(this.prefixFields(fields));

		return this;
	}

	addSelect(fields: string[]) {
		this.query.addSelect(this.prefixFields(fields));

		return this;
	}

	/**
	 * Ensure all fields are prefixed with an entity alias if not add this.entityAlias
	 *
	 * @param fields
	 * @private
	 */
	private prefixFields(fields: string[]) {
		return fields.map((field) =>
			field.includes('.') ? field : `${this.entityAlias}.${field}`,
		);
	}

	private isValidColumn(column: string): boolean {
		// Allow only letters, numbers, underscores dots and cast characters (:)
		const columnPattern = /^[a-zA-Z0-9_.:]+$/;

		return columnPattern.test(column);
	}

	private prepareColumn(column: string): string {
		// Validate or sanitize the column name
		if (!this.isValidColumn(column)) {
			throw new Error(`Invalid column name: ${column}`);
		}

		return column.includes('.') ? column : `${this.entityAlias}.${column}`;
	}

	private safeColumnKey(column: string): string {
		return (
			column
				// Replace all non-alphanumeric characters (except underscore) with _
				.replace(/[^a-zA-Z0-9_]/g, '_')
				// Remove leading/trailing underscores
				.replace(/^_+|_+$/g, '')
				// Ensure it doesn't start with a number
				.replace(/^(\d)/, 'param_$1')
		);
	}

	private buildWhereCondition(
		column: string,
		columnKey: string,
		operator: string,
	): string {
		switch (operator) {
			case 'IN':
				return `${this.prepareColumn(column)} IN (:...${columnKey})`;
			default:
				return `${this.prepareColumn(column)} ${operator} :${columnKey}`;
		}
	}

	/**
	 * Return query builder object so further TypeOrm methods can be chained
	 */
	getQuery(): QueryBuilder<TEntity> {
		return this.query;
	}

	withDeleted(condition: boolean = true) {
		if (condition) {
			this.query.withDeleted();
		}

		return this;
	}

	/**
	 * Note: When using getOne(), TypeORM expects only entity fields to be selected.
	 *       If you manually select raw SQL fields (e.g., COUNT(user.id) as count), getOne() will return null.
	 */
	first() {
		return this.query.getOne();
	}

	firstRaw() {
		return this.query.getRawOne();
	}

	async firstOrFail(isRaw: boolean = false) {
		const result = isRaw ? await this.firstRaw() : await this.first();

		if (!result) {
			throw new NotFoundError(
				lang(
					`${this.entityAlias}.error.not_found`,
					{},
					'Entry not found',
				),
			);
		}

		return result;
	}

	orderBy(
		column?: string,
		direction: OrderDirectionEnum = OrderDirectionEnum.ASC,
	): this {
		if (column) {
			this.query.addOrderBy(`${this.prepareColumn(column)}`, direction);
		}

		return this;
	}

	groupBy(column: string): this {
		if (column) {
			this.hasGroup = true;

			this.query.addGroupBy(`${this.prepareColumn(column)}`);
		}

		return this;
	}

	pagination(page: number = 1, limit: number = 10): this {
		this.query.skip((page - 1) * limit).take(limit);

		return this;
	}

	all(withCount: boolean = false, isRaw: boolean = false) {
		if (withCount) {
			if (isRaw) {
				throw new CustomError(
					500,
					lang('error.db_select_count_while_using_raw'),
				);
			}

			if (this.hasGroup) {
				throw new CustomError(
					500,
					lang('error.db_select_count_while_using_groups'),
				);
			}

			return this.query.getManyAndCount();
		}

		if (isRaw) {
			return this.query.getRawMany();
		}

		return this.query.getMany();
	}

	count() {
		return this.query.getCount();
	}

	/**
	 * Used to (soft) delete a single entity or multiple entities
	 * Events will be triggered (ex: beforeRemove for delete, afterSoftRemove for soft delete)
	 *
	 * @param isSoftDelete - if set as `true` will be soft deleted
	 * @param multiple - must be set as `true` to allow multiple entity deletion
	 * @param force - if set as `true` will allow deletion without filter (note: Use with caution!!!)
	 */
	async delete(
		isSoftDelete: boolean = true,
		multiple: boolean = false,
		force: boolean = false,
	): Promise<number> {
		if (!force && !this.hasFilter) {
			throw new CustomError(500, lang('error.db_delete_missing_filter'));
		}

		const results = await this.query.getMany();

		if (results.length === 0) {
			return 0;
		}

		if (!multiple && results.length > 1) {
			throw new CustomError(500, lang('error.db_delete_one'));
		}

		const contextData: EntityContextData | undefined =
			this.getContextData();

		// Set contextData for each entity
		if (contextData !== undefined) {
			results.forEach((entity) => {
				(entity as ObjectLiteral).contextData = contextData;
			});
		}

		if (isSoftDelete) {
			results.map((entity) => this.repository.softRemove(entity));
		} else {
			results.map((entity) => this.repository.remove(entity));
		}

		return results.length;
	}

	async restore(
		multiple: boolean = false,
		force: boolean = false,
	): Promise<number> {
		if (!force && !this.hasFilter) {
			throw new CustomError(500, lang('error.db_restore_missing_filter'));
		}

		const results = await this.query.withDeleted().getMany();

		if (results.length === 0) {
			return 0;
		}

		if (!multiple && results.length > 1) {
			throw new CustomError(500, lang('error.db_restore_one'));
		}

		const contextData: EntityContextData | undefined =
			this.getContextData();

		// Set contextData and restore using save() flow
		for (const entity of results) {
			if (contextData) {
				(entity as ObjectLiteral).contextData = contextData;
			}

			(entity as ObjectLiteral).deleted_at = null;

			await this.repository.save(entity);
		}

		return results.length;
	}

	filterBy(column: string, value?: QueryValue, operator: string = '='): this {
		if (value) {
			if (operator === 'IN' && !Array.isArray(value)) {
				throw new CustomError(
					500,
					'IN operator requires an array for `value`',
				);
			}

			if (operator !== 'IN' && Array.isArray(value)) {
				throw new CustomError(
					500,
					'`value` cannot be an array for operator other than `IN`',
				);
			}

			switch (operator) {
				case '=':
					if (column.endsWith('_id') || column.endsWith('.id')) {
						this.hasFilter = true;
					}
					break;
				case 'IN':
					if (column.endsWith('_id') || column.endsWith('.id')) {
						this.hasFilter = true;
					}
					break;
				case 'LIKE':
				case 'ILIKE':
					value = `%${value}%`;
					break;
				case 'START_LIKE':
				case 'START_ILIKE':
					operator = 'LIKE';
					value = `${value}%`;
					break;
				case 'END_LIKE':
				case 'END_ILIKE':
					operator = 'LIKE';
					value = `%${value}`;
					break;
			}

			const columnKey = this.safeColumnKey(column);

			this.query.andWhere(
				this.buildWhereCondition(column, columnKey, operator),
				{ [columnKey]: value },
			);
		}

		return this;
	}

	filterAny(filters: FilterByPropsType[]): this {
		const conditions: string[] = [];
		const params: QueryParams = {};

		filters.forEach((filter) => {
			if (filter.value) {
				let operator = filter.operator;
				let value = filter.value;

				if (operator === 'IN' && !Array.isArray(value)) {
					throw new CustomError(
						500,
						'IN operator requires an array for `value`',
					);
				}

				if (operator !== 'IN' && Array.isArray(value)) {
					throw new CustomError(
						500,
						'`value` cannot be an array for operator other than `IN`',
					);
				}

				switch (operator) {
					case 'LIKE':
					case 'ILIKE':
						value = `%${value}%`;
						break;
					case 'START_LIKE':
					case 'START_ILIKE':
						operator = 'LIKE';
						value = `${value}%`;
						break;
					case 'END_LIKE':
					case 'END_ILIKE':
						operator = 'LIKE';
						value = `%${value}`;
						break;
				}

				const columnKey = this.safeColumnKey(filter.column);

				conditions.push(
					this.buildWhereCondition(
						filter.column,
						columnKey,
						operator,
					),
				);

				params[columnKey] = value;
			}
		});

		if (conditions.length > 0) {
			this.query.andWhere(
				new Brackets((qb) => {
					qb.where(conditions.join(' OR '), params);
				}),
			);
		}

		return this;
	}

	filterByRange(
		column: string,
		min?: Date | string | null,
		max?: Date | string | null,
	): this {
		const minValue = min instanceof Date ? formatDate(min) : min;
		const maxValue = max instanceof Date ? formatDate(max) : max;

		if (minValue && maxValue) {
			const stringColumn = this.safeColumnKey(column);
			column = this.prepareColumn(column);

			this.query.andWhere(
				`${column} BETWEEN :min${stringColumn} AND :max${stringColumn}`,
				{
					[`min${stringColumn}`]: minValue,
					[`max${stringColumn}`]: maxValue,
				},
			);
		} else if (minValue) {
			this.filterBy(column, minValue, '>=');
		} else if (maxValue) {
			this.filterBy(column, maxValue, '<=');
		}

		return this;
	}

	filterById(id?: number | null) {
		if (id) {
			this.hasFilter = true;
			this.filterBy('id', id);
		}

		return this;
	}

	filterByStatus(status?: string | null) {
		if (status) {
			this.filterBy('status', status);
		}

		return this;
	}
}

export default RepositoryAbstract;
