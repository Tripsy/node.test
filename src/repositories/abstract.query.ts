import {Repository} from 'typeorm/repository/Repository';
import {QueryBuilder, SelectQueryBuilder} from 'typeorm';
import {lang} from '../config/i18n-setup.config';
import NotFoundError from '../exceptions/not-found.error';
import CustomError from '../exceptions/custom.error';
import {OrderDirectionEnum} from "../enums/order-direction.enum";
import {EntityContextData} from '../types/entity-context-data.type';
import {formatDate} from '../helpers/date.helper';

class AbstractQuery {
    private repository: Repository<any>;
    protected entityAlias: string;
    protected query: SelectQueryBuilder<any>;
    protected hasFilter: boolean = false; // Flag used to signal if query builder filters have been applied in preparation for delete operations
    protected hasGroup: boolean = false; // Flag used to signal if query builder groups have been applied
    protected contextData: EntityContextData | undefined;

    constructor(repository: Repository<any>, entityAlias: string) {
        this.repository = repository;
        this.entityAlias = entityAlias;
        this.query = repository.createQueryBuilder(this.entityAlias);
    }

    debugSql(): string {
        return this.query.getSql();
    }

    debugParameters(): any {
        return this.query.getParameters();
    }

    debugWriteToConsole(): this {
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
    join(entityOrProperty: string, alias: string, type: 'INNER' | 'LEFT' = 'INNER', condition?: string): this {
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
            const hasPrimaryKey = fields.some(field => primaryKeys.includes(field));

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
        return fields.map(field =>
            field.includes('.') ? field : `${this.entityAlias}.${field}`
        );
    }

    isValidColumn(column: string): boolean {
        const columnPattern = /^[a-zA-Z0-9_.]+$/; // Allow only letters, numbers, underscores, and dots

        return columnPattern.test(column);
    }

    // private prepareColumn(column: string): string {
    //     // Validate or sanitize the column name
    //     if (!this.isValidColumn(column)) {
    //         throw new Error(`Invalid column name: ${column}`);
    //     }
    //
    //     return column.includes('.') ? column : `${this.entityAlias}.${column}`
    // }

    private prepareColumn(column: string): string {
        column = column.trim();

        // Validate or sanitize the column name
        if (!this.isValidColumn(column)) {
            throw new Error(`Invalid column name: ${column}`);
        }

        // If the column includes a dot (table.column), split and escape both parts
        if (column.includes('.')) {
            const [table, col] = column.split('.');
            return `\`${table}\`.\`${col}\``;
        }

        // Escape reserved words or special characters
        return `\`${this.entityAlias}\`.\`${column}\``;
    }


    /**
     * Return query builder object so further TypeOrm methods can be chained
     */
    getQuery(): QueryBuilder<any> {
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
            throw new NotFoundError(lang(`${this.entityAlias}.error.not_found`));
        }

        return result;
    }

    orderBy(column?: string, direction: OrderDirectionEnum = OrderDirectionEnum.ASC): this {
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
        this.query
            .skip((page - 1) * limit)
            .take(limit);

        return this;
    }

    all(withCount: boolean = false, isRaw: boolean = false) {
        if (withCount) {
            if (isRaw) {
                throw new CustomError(500, lang('error.db_select_count_while_using_raw'));
            }

            if (this.hasGroup) {
                throw new CustomError(500, lang('error.db_select_count_while_using_groups'));
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
    async delete(isSoftDelete: boolean = true, multiple: boolean = false, force: boolean = false): Promise<number> {
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

        const contextData: EntityContextData | undefined = this.getContextData();

        // Set contextData for each entity
        if (contextData !== undefined) {
            results.forEach(entity => {
                (entity as any).contextData = contextData;
            });
        }

        if (isSoftDelete) {
            results.map(entity => this.repository.softRemove(entity));
        } else {
            results.map(entity => this.repository.remove(entity));
        }

        return results.length;
    }

    // async restore(multiple: boolean = false, force: boolean = false): Promise<number> {
    //     if (!force && !this.hasFilter) {
    //         throw new CustomError(500, lang('error.db_restore_missing_filter'));
    //     }
    //
    //     const results = await this.query.withDeleted().getMany();
    //
    //     if (results.length === 0) {
    //         return 0;
    //     }
    //
    //     if (!multiple && results.length > 1) {
    //         throw new CustomError(500, lang('error.db_restore_one'));
    //     }
    //
    //     const contextData: EntityContextData | undefined = this.getContextData();
    //
    //     // Set contextData for each entity
    //     if (contextData !== undefined) {
    //         results.forEach(entity => {
    //             (entity as any).contextData = contextData;
    //         });
    //     }
    //
    //     results.map(entity => this.repository.restore(entity));
    //
    //     return results.length;
    // }

    async restore(multiple: boolean = false, force: boolean = false): Promise<number> {
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

        const contextData: EntityContextData | undefined = this.getContextData();

        // Set contextData and restore using save() flow
        for (const entity of results) {
            if (contextData) {
                (entity as any).contextData = contextData;
            }

            (entity as any).deleted_at = null;

            await this.repository.save(entity);
        }

        return results.length;
    }

    filterBy(column: string, value?: string | number | (string | number)[] | null, operator: string = '='): this {
        if (value) {
            const columns = column.split(',').map(col => this.prepareColumn(col));

            if (columns.length > 1 && operator === 'IN') {
                throw new CustomError(500, 'The IN operator can only be used with a single column');
            }

            switch (operator) {
                case '=':
                    if (columns.length === 1) {
                        if (columns[0].endsWith('_id') || columns[0].endsWith('.id')) {
                            this.hasFilter = true;
                        }
                    }
                    break;
                case 'IN':
                    if (columns.length === 1) {
                        if (columns[0].endsWith('_id') || columns[0].endsWith('.id')) {
                            this.hasFilter = true;
                        }
                    }
                    break;
                case 'LIKE':
                    value = `%${value}%`;
                    break;
                case 'START_LIKE':
                    operator = 'LIKE';
                    value = `${value}%`;
                    break;
                case 'END_LIKE':
                    operator = 'LIKE';
                    value = `%${value}`;
                    break;
            }

            switch (operator) {
                case 'IN':
                    this.query.andWhere(`${column} IN (:...${column})`, {[column]: value as (string | number)[]});
                    break;
                default:
                    if (columns.length > 1) {
                        const whereString = columns
                            .map(col => `${col} ${operator} :${col}`)
                            .join(' OR ');

                        const whereParams = Object.fromEntries(
                            columns.map(col => [col, value])
                        );

                        this.query.andWhere(`(${whereString})`, whereParams);
                    } else {
                        this.query.andWhere(`${this.prepareColumn(column)} ${operator} :${column}`, {[column]: value});
                    }
                    break;
            }
        }

        return this;
    }

    filterByRange(column: string, min?: Date | number | null, max?: Date | number | null): this {
        const minValue = min instanceof Date ? formatDate(min) : min;
        const maxValue = max instanceof Date ? formatDate(max) : max;

        if (min && max) {
            column = this.prepareColumn(column);

            this.query.andWhere(`${column} BETWEEN :min${column} AND :max${column}`, {
                [`min${column}`]: minValue,
                [`max${column}`]: maxValue,
            });
        } else if (min) {
            this.filterBy(column, minValue, '>=');
        } else if (max) {
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

export default AbstractQuery;
