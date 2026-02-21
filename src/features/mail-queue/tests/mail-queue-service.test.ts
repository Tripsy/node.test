import { expect, jest } from '@jest/globals';
import type MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import { mailQueueOutputPayloads } from '@/features/mail-queue/mail-queue.mock';
import type { MailQueueQuery } from '@/features/mail-queue/mail-queue.repository';
import { MailQueueService } from '@/features/mail-queue/mail-queue.service';
import type { MailQueueValidator } from '@/features/mail-queue/mail-queue.validator';
import {
	createMockRepository,
	testServiceDeleteMultiple,
	testServiceFindByFilter,
	testServiceFindById,
} from '@/tests/jest-service.setup';

describe('MailQueueService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const { query, repository } = createMockRepository<
		MailQueueEntity,
		MailQueueQuery
	>();
	const serviceMailQueue = new MailQueueService(repository);

	testServiceDeleteMultiple<MailQueueEntity, MailQueueQuery>(
		query,
		serviceMailQueue,
		{
			ids: [1, 2, 3],
		},
	);
	testServiceFindById<MailQueueEntity, MailQueueQuery>(
		query,
		serviceMailQueue,
	);

	// it('should apply filters and return paginated results', async () => {
	//     query.all.mockResolvedValue([[], 0]);
	//
	//     const findData = mailQueueOutputPayloads.get('find')
	//
	//     const result = await serviceMailQueue.findByFilter(findData);
	//
	//     expect(query.all).toHaveBeenCalledWith(true);
	//     expect(result).toEqual([[], 0]);
	// });

	testServiceFindByFilter<
		MailQueueEntity,
		MailQueueQuery,
		MailQueueValidator
	>(query, serviceMailQueue, mailQueueOutputPayloads.get('find'));
});
