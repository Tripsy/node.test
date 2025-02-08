import {SelectQueryBuilder} from 'typeorm';
import {lang} from '../config/i18n-setup.config';
import NotFoundError from '../exceptions/not-found.error';

class AbstractQuery {
    protected query: SelectQueryBuilder<any>;
    protected entityAlias: string;

    /**
     * Ensure the primary key is included; If id is missing, TypeORM won’t map the entity correctly.
     *
     * ex: ['user.id', 'user.name', 'user.email', 'user.status', 'user.created_at', 'user.updated_at']
     */
    select(strings: string[]) {
        this.query.select(strings);

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
