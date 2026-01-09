import { EventSubscriber, type InsertEvent, type UpdateEvent } from 'typeorm';
import { Configuration } from '@/config/settings.config';
import {
	type AccountService,
	accountService,
} from '@/features/account/account.service';
import { LogHistoryAction } from '@/features/log-history/log-history.entity';
import UserEntity, { UserStatusEnum } from '@/features/user/user.entity';
import SubscriberAbstract from '@/lib/abstracts/subscriber.abstract';

@EventSubscriber()
export class UserSubscriber extends SubscriberAbstract<UserEntity> {
	protected readonly Entity = UserEntity;
	private accountService: AccountService;

	constructor() {
		super();

		this.config = {
			beforeRemove: true,
			afterSoftRemove: true,
		};

		this.accountService = accountService;
	}

	async beforeInsert(event: InsertEvent<UserEntity>) {
		// Hash password before inserting a new user.
		if (event.entity.password) {
			event.entity.password = await this.accountService.encryptPassword(
				event.entity.password,
			);
		}

		// Set the default language
		if (!event.entity.language) {
			event.entity.language = Configuration.get('app.language') as string;
		}

		event.entity.password_updated_at = new Date();
	}

	async beforeUpdate(event: UpdateEvent<UserEntity>) {
		// Hash the password before updating if it has changed.
		if (event.entity?.password) {
			event.entity.password = await this.accountService.encryptPassword(
				event.entity.password,
			);
		}
	}

	async afterInsert(event: InsertEvent<UserEntity>) {
		const id = event.entity.id;

		this.logHistory(id, LogHistoryAction.CREATED);

		void this.accountService.processRegistration(event.entity);
	}

	async afterUpdate(event: UpdateEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		this.cacheClean(id);

		this.logHistory(
			id,
			this.isRestore(event)
				? LogHistoryAction.RESTORED
				: LogHistoryAction.UPDATED,
		);

		// Check if the status was updated
		if (
			event.entity?.status &&
			event.databaseEntity?.status &&
			event.entity.status !== event.databaseEntity.status
		) {
			this.logHistory(id, LogHistoryAction.STATUS, {
				oldStatus: event.databaseEntity.status,
				newStatus: event.entity.status,
			});

			if (event.entity.status === UserStatusEnum.ACTIVE) {
				await this.accountService.processRegistration({
					id: id,
					name: event.entity.name || event.databaseEntity.name,
					email: event.entity.email || event.databaseEntity.email,
					language:
						event.entity.language || event.databaseEntity.language,
					status: event.entity.status,
				});
			}
		}

		// Check if the password was updated
		if (
			event.entity?.password &&
			event.databaseEntity?.password &&
			event.entity.password !== event.databaseEntity.password
		) {
			this.logHistory(id, LogHistoryAction.PASSWORD_CHANGE);
		}
	}
}
