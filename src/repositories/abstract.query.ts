import {SelectQueryBuilder} from 'typeorm';
import {lang} from '../config/i18n-setup.config';
import NotFoundError from '../exceptions/not-found.error';

class AbstractQuery {
    protected query: SelectQueryBuilder<any>;
    protected entityAlias: string;

    constructor(query: SelectQueryBuilder<any>, entityAlias: string) {
        this.query = query;
        this.entityAlias = entityAlias;
    }

    /**
     * Note: Without primaryKey TypeORM won’t map the entity correctly.
     *
     * ex: ['user.id', 'user.name', 'user.email', 'user.status', 'user.created_at', 'user.updated_at']
     * ex: ['id', 'name', 'email', 'status', 'created_at', 'updated_at']
     */
    select(strings: string[]): this {
        // Define possible primary key variations
        const primaryKeys = [`${this.entityAlias}.id`, 'id'];

        // Check if either 'id' or 'user.id' is already included
        const hasPrimaryKey = strings.some(field => primaryKeys.includes(field));

        // If not present, add the fully qualified primary key
        if (!hasPrimaryKey) {
            strings.unshift(`${this.entityAlias}.id`);
        }

        // Ensure all fields are prefixed with an entity alias if not add this.entityAlias
        const prefixedFields = strings.map(field =>
            field.includes('.') ? field : `${this.entityAlias}.${field}`
        );

        this.query.select(prefixedFields);

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

        // console.log('SQL:', this.query.getSql());
        // console.log('Parameters:', this.query.getParameters());
        // console.log('Result:', result);

        if (!result) {
            throw new NotFoundError(lang(`${this.entityAlias}.error.not_found`));
        }

        return result;
    }

    filterById(id: number) {
        if (id) {
            this.query.andWhere(`${this.entityAlias}.id = :id`, {id});
        }

        return this;
    }

    filterByName(name: string) {
        if (name) {
            this.query.andWhere(`${this.entityAlias}.name = :name`, {name});
        }

        return this;
    }
}

export default AbstractQuery;
