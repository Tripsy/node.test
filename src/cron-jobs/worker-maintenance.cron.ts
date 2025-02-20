import emailQueue from '../queues/email.queue';

export const workerMaintenance = async (): Promise<{}> => {
    // Remove failed jobs older than 24 hours
    const removedFailedJobs = await emailQueue.clean(1000 * 60 * 60 * 24, 200, 'failed');

    return {
        removedFailedJobs: removedFailedJobs.length
    };
};