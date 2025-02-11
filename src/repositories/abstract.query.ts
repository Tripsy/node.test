import {Repository} from 'typeorm/repository/Repository';
import {QueryBuilder, SelectQueryBuilder} from 'typeorm';
import {lang} from '../config/i18n-setup.config';
import NotFoundError from '../exceptions/not-found.error';
import CustomError from '../exceptions/custom.error';

class AbstractQuery {
    private repository: Repository<any>;
    protected entityAlias: string;
    protected query: SelectQueryBuilder<any>;
    protected hasFilter: boolean = false; // Flag used to signal if any query builder filters have been applied

    constructor(repository: Repository<any>, entityAlias: string) {
        this.repository = repository;
        this.entityAlias = entityAlias;
        this.query = repository.createQueryBuilder(this.entityAlias);
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

    /**
     * Return query builder object so further TypeOrm methods can be chained
     */
    getQuery(): QueryBuilder<any> {
        return this.query;
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

    all() {
        return this.query.getMany();
    }

    async firstOrFail(isRaw: boolean = false) {
        const result = isRaw ? await this.firstRaw() : await this.first();

        // console.log('SQL:', this.query.getSql());
        // console.log('Parameters:', this.query.getParameters());
        // console.log('Result:', result);

        if (!result) {
            throw new NotFoundError(lang(`${this.entityAlias}.error.not_found`));
        }

        return result;
    }

    /**
     * Used to delete a single entity or multiple entities
     * Events (ex: beforeRemove, afterSoftRemove) will be triggered
     *
     * @param multiple - must be set as `true` to allow multiple entity deletion
     * @param force - if set as `true` will allow deletion without filter (note: Use with caution!!!)
     */
    async softDelete(multiple: boolean = false, force: boolean = false) {
        if (!force && !this.hasFilter) {
            throw new CustomError(500, lang('error.db_delete_missing_filter'));
        }

        const results = await this.query.getMany();

        if (results.length === 0) {
            throw new NotFoundError(lang('error.db_nothing_to_delete'));
        }

        if (!multiple && results.length > 1) {
            throw new CustomError(500, lang('error.db_delete_one'));
        }

        results.map(entity => this.repository.softRemove(entity));
    }

    getLike(column: string, value?: string): this {
        if (value) {
            column = column.includes('.') ? column : `${this.entityAlias}.${column}`

            this.hasFilter = value.length > 5; // Condition set to avoid too generic results
            this.query.andWhere(`${column} LIKE :value`, { value: `%${value}%` });
        }

        return this;
    }

    filterById(id?: number) {
        if (id) {
            this.hasFilter = true;
            this.query.andWhere(`${this.entityAlias}.id = :id`, {id});
        }

        return this;
    }

    filterByStatus(status?: string) {
        if (status) {
            // his.hasFilter = true; // Too generic
            this.query.andWhere(`${this.entityAlias}.status = :status`, { status });
        }

        return this;
    }
}

export default AbstractQuery;
