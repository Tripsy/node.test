import getEmailQueue from '@/queues/email.queue';

export const SCHEDULE_EXPRESSION = '04 */6 * * *';
export const EXPECTED_RUN_TIME = 3; // seconds

const workerMaintenance = async () => {
	// Remove failed jobs older than 24 hours
	const removedFailedJobs = await getEmailQueue()?.clean(
		1000 * 60 * 60 * 24,
		200,
		'failed',
	);

	return {
		removedFailedJobs: removedFailedJobs?.length || 0,
	};
};

export default workerMaintenance;
