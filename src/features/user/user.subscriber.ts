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
import UserEntity from '@/features/user/user.entity';
import { UserQuery } from '@/features/user/user.repository';
import { UserStatusEnum } from '@/features/user/user-status.enum';
import {
	cacheClean,
	getAuthIdFromContext,
	isRestore,
	logHistory,
	removeOperation,
	restoreOperation,
} from '@/helpers/subscriber.helper';

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
	 * When entry is removed from the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	beforeRemove(event: RemoveEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: UserQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			false,
		);
	}

	/**
	 * When entry is marked as deleted in the database
	 * `event.entity` will be undefined if entity is not properly loaded via Repository
	 *
	 * @param event
	 */
	afterSoftRemove(event: SoftRemoveEvent<UserEntity>) {
		const id: number = event.entity?.id || event.databaseEntity.id;

		removeOperation(
			{
				entity: UserQuery.entityAlias,
				id: id,
				auth_id: getAuthIdFromContext(event.entity?.contextData),
			},
			true,
		);
	}

	async afterInsert(event: InsertEvent<UserEntity>) {
		const id = event.entity.id;

		logHistory(UserQuery.entityAlias, 'created', {
			id: id.toString(),
			auth_id: getAuthIdFromContext(event.entity?.contextData).toString(),
		});

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
		const auth_id: number = getAuthIdFromContext(event.entity?.contextData);

		// When entry is restored
		if (isRestore(event)) {
			restoreOperation({
				entity: UserQuery.entityAlias,
				id: id,
				auth_id: auth_id,
			});

			return;
		}

		// When entry is updated
		cacheClean(UserQuery.entityAlias, id);

		logHistory(UserQuery.entityAlias, 'updated', {
			id: id.toString(),
			auth_id: auth_id.toString(),
		});

		// Check if status was updated
		if (
			event.entity?.status &&
			event.databaseEntity?.status &&
			event.entity.status !== event.databaseEntity.status
		) {
			logHistory(UserQuery.entityAlias, 'status', {
				id: id.toString(),
				oldStatus: event.databaseEntity.status,
				newStatus: event.entity.status,
				auth_id: auth_id.toString(),
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

		// Check if password was updated
		if (
			event.entity?.password &&
			event.databaseEntity?.password &&
			event.entity.password !== event.databaseEntity.password
		) {
			logHistory(UserQuery.entityAlias, 'password_change', {
				id: id.toString(),
				auth_id: auth_id.toString(),
			});
		}
	}
}
