import { appReady, closeHandler, server } from '@/app';

beforeAll(async () => {
	await appReady;
});

afterAll(async () => {
    const srv = server;

    if (srv) {
        await new Promise<void>((resolve, reject) => {
            srv.close((err) => {
                if (err) return reject(err);

                closeHandler().then(resolve).catch(reject);
            });
        });
    } else {
        await closeHandler();
    }
});