import {Repository} from 'typeorm/repository/Repository';
import {QueryBuilder, SelectQueryBuilder} from 'typeorm';
import {lang} from '../config/i18n-setup.config';
import NotFoundError from '../exceptions/not-found.error';
import CustomError from '../exceptions/custom.error';
import {dateToString} from '../helpers/utils.helper';
import {OrderDirectionEnum} from "../enums/order-direction.enum";
import {EntityContextData} from '../types/entity-context-data.type';

class AbstractQuery {
    private repository: Repository<any>;
    protected entityAlias: string;
    protected query: SelectQueryBuilder<any>;
    protected hasFilter: boolean = false; // Flag used to signal if query builder filters have been applied in preparation for delete operations
    protected contextData: EntityContextData | undefined;

    constructor(repository: Repository<any>, entityAlias: string) {
        this.repository = repository;
        this.entityAlias = entityAlias;
        this.query = repository.createQueryBuilder(this.entityAlias);
    }

    consoleDebug(): this {
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
     * Note: Without primaryKey TypeORM won’t map the entity correctly.
     *
     * ex: ['user.id', 'user.name', 'user.email', 'user.status', 'user.created_at', 'user.updated_at']
     * ex: ['id', 'name', 'email', 'status', 'created_at', 'updated_at']
     */
    select(fields: string[]): this {
        // Define possible primary key variations
        const primaryKeys = [`${this.entityAlias}.id`, 'id'];

        // Check if either 'id' or 'user.id' is already included
        const hasPrimaryKey = fields.some(field => primaryKeys.includes(field));

        // If not present, add the fully qualified primary key
        if (!hasPrimaryKey) {
            fields.unshift(`${this.entityAlias}.id`);
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

    private prepareColumn(column: string): string {
        // Validate or sanitize the column name
        if (!this.isValidColumn(column)) {
            throw new Error(`Invalid column name: ${column}`);
        }

        return column.includes('.') ? column : `${this.entityAlias}.${column}`
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

    pagination(page: number = 1, limit: number = 10): this {
        this.query
            .skip((page - 1) * limit)
            .take(limit);

        return this;
    }

    all(withCount: boolean = false) {
        if (withCount) {
            return this.query.getManyAndCount();
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

    filterBy(column: string, value?: string | number | null, operator: string = '='): this {
        if (value) {
            column = this.prepareColumn(column);

            switch (operator) {
                case '=':
                    if (column.endsWith('_id')) {
                        this.hasFilter = true;
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

            this.query.andWhere(`${column} ${operator} :${column}`, { [column]: value });
        }

        return this;
    }

    filterByRange(column: string, min?: Date | number | null, max?: Date | number | null): this {
        const minValue = min instanceof Date ? dateToString(min) : min;
        const maxValue = max instanceof Date ? dateToString(max) : max;

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
