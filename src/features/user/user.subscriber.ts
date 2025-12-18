import {
	type EntitySubscriberInterface,
	EventSubscriber,
	type InsertEvent,
	type RemoveEvent,
	type SoftRemoveEvent,
	type UpdateEvent,
} from 'typeorm';
import { cfg } from '@/config/settings.config';
import {
	encryptPassword,
	sendEmailConfirmCreate,
	sendWelcomeEmail,
} from '@/features/account/account.service';
import UserEntity, { UserStatusEnum } from '@/features/user/user.entity';
import { UserQuery } from '@/features/user/user.repository';
import {
	cacheClean,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/helpers';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
	/**
	 * Specify which entity this subscriber is for.
	 */
	listenTo() {
		return UserEntity;
	}

	async beforeInsert(event: InsertEvent<UserEntity>) {
		// Hash password before inserting a new user.
		if (event.entity.password) {
			event.entity.password = await encryptPassword(
				event.entity.password,
			);
		}

		// Set default language
		if (!event.entity.language) {
			event.entity.language = cfg('app.language') as string;
		}

		event.entity.password_updated_at = new Date();
	}

	async beforeUpdate(event: UpdateEvent<UserEntity>) {
		// Hash password before updating if it has changed.
		if (event.entity?.password) {
			event.entity.password = await encryptPassword(
				event.entity.password,
			);
		}
	}

	/**
	 * When entry is removed from the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(UserQuery.entityAlias, id, false);
	}

	/**
	 * When the entry is marked as deleted in the database,
	 * `event.entity` will be undefined if the entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(UserQuery.entityAlias, id, true);
	}

	async afterInsert(event: InsertEvent<UserEntity>) {
		const id = event.entity.id;

		logHistory(UserQuery.entityAlias, id, 'created');

		switch (event.entity.status) {
			case UserStatusEnum.ACTIVE:
				await sendWelcomeEmail(event.entity);
				break;
			case UserStatusEnum.PENDING:
				await sendEmailConfirmCreate(event.entity);
				break;
		}
	}

	async afterUpdate(event: UpdateEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		if (isRestore(event)) {
			restoreOperation(UserQuery.entityAlias, id);

			return;
		}

		cacheClean(UserQuery.entityAlias, id);
		logHistory(UserQuery.entityAlias, id, 'updated');

		// Check if the status was updated
		if (
			event.entity?.status &&
			event.databaseEntity?.status &&
			event.entity.status !== event.databaseEntity.status
		) {
			logHistory(UserQuery.entityAlias, id, 'status', {
				oldStatus: event.databaseEntity.status,
				newStatus: event.entity.status,
			});

			if (event.entity.status === UserStatusEnum.ACTIVE) {
				await sendWelcomeEmail({
					name: event.entity.name || event.databaseEntity.name,
					email: event.entity.email || event.databaseEntity.email,
					language:
						event.entity.language || event.databaseEntity.language,
				});
			}
		}

		// Check if the password was updated
		if (
			event.entity?.password &&
			event.databaseEntity?.password &&
			event.entity.password !== event.databaseEntity.password
		) {
			logHistory(UserQuery.entityAlias, id, 'password_change');
		}
	}
}
