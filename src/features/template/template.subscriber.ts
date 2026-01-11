import {
	EventSubscriber,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import { LogHistoryAction } from '@/features/log-history/log-history.entity';
import TemplateEntity from '@/features/template/template.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class TemplateSubscriber extends SubscriberAbstract<TemplateEntity> {
	protected readonly Entity = TemplateEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
		};
	}

	beforeRemove(event: RemoveEvent<TemplateEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);
		this.cacheClean([
			event.databaseEntity.label,
			event.databaseEntity.language,
			event.databaseEntity.type,
		]);

		this.logHistory(id, LogHistoryAction.REMOVED);
	}

	afterSoftRemove(event: SoftRemoveEvent<TemplateEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);
		this.cacheClean(event.databaseEntity.label);

		this.logHistory(id, LogHistoryAction.DELETED);
	}

	async afterUpdate(event: UpdateEvent<TemplateEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);
		this.cacheClean(event.databaseEntity.label);

		this.logHistory(
			id,
			this.isRestore(event)
				? LogHistoryAction.RESTORED
				: LogHistoryAction.UPDATED,
		);
	}
}
