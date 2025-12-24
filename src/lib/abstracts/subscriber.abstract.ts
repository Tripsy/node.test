import type {
	EntitySubscriberInterface,
	InsertEvent,
	RemoveEvent,
	SoftRemoveEvent,
	UpdateEvent,
} from 'typeorm';
import { eventEmitter } from '@/config/event.config';
import { LogHistoryAction } from '@/features/log-history/log-history.entity';
import { getCacheProvider } from '@/lib/providers/cache.provider';

interface BaseEntity {
	id: number;
	deleted_at?: Date | null;
}

type EntityWithTable<T> = {
	new (): T;
	NAME: string;
	HAS_CACHE: boolean;
};

export type SubscriberConfig = {
	beforeRemove?: boolean;
	afterSoftRemove?: boolean;
	afterInsert?: boolean;
	afterUpdate?: boolean;
};

abstract class SubscriberAbstract<T extends BaseEntity>
	implements EntitySubscriberInterface<T>
{
	protected abstract readonly Entity: EntityWithTable<T>;

	protected config: SubscriberConfig = {
		beforeRemove: false,
		afterSoftRemove: false,
		afterInsert: false,
		afterUpdate: false,
	};

	listenTo() {
		return this.Entity;
	}

	protected getEntityName(): string {
		return this.Entity.NAME;
	}

	protected isRestore(event: UpdateEvent<T>): boolean {
		if (!event.entity || !event.databaseEntity) {
			return false;
		}

		if (
			event.entity.deleted_at === undefined ||
			event.databaseEntity.deleted_at === undefined
		) {
			return false; // not a soft-delete entity
		}

		return (
			event.entity.deleted_at === null &&
			event.databaseEntity.deleted_at !== null
		);
	}

	cacheClean<E extends { NAME: string; HAS_CACHE: boolean }>(
		ident: number | string,
		entity?: E,
	) {
		const cachedEntity = entity || this.Entity;

		if (!cachedEntity.HAS_CACHE) {
			return;
		}

		const identString = ident.toString();

		if (!identString) {
			return;
		}

		const cacheProvider = getCacheProvider();

		// TODO use event
		void cacheProvider.deleteByPattern(
			`${cacheProvider.buildKey(cachedEntity.NAME, identString)}*`,
		);
	}

	logHistory(
		id: number,
		action: LogHistoryAction,
		data?: Record<string, string | number>,
	) {
		eventEmitter.emit('history', {
			entity: this.getEntityName(),
			entity_ids: [id],
			action: action,
			data: data,
		});
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<T>) {
		if (!this.config.beforeRemove) {
			return;
		}

		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);

		this.logHistory(id, LogHistoryAction.REMOVED);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<T>) {
		if (!this.config.afterSoftRemove) {
			return;
		}

		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);

		this.logHistory(id, LogHistoryAction.DELETED);
	}

	afterInsert(event: InsertEvent<T>) {
		if (!this.config.afterInsert) {
			return;
		}

		this.logHistory(event.entity.id, LogHistoryAction.CREATED);
	}

	afterUpdate(event: UpdateEvent<T>) {
		if (!this.config.afterUpdate) {
			return;
		}

		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);

		this.logHistory(
			id,
			this.isRestore(event)
				? LogHistoryAction.RESTORED
				: LogHistoryAction.UPDATED,
		);
	}
}

export default SubscriberAbstract;
