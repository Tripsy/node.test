import {appReady, closeHandler, server} from '../app';

beforeAll(async () => {
    await appReady;
});

afterAll(async () => {
    if (server) {
        await new Promise<void>((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    return reject(err);
                }

                closeHandler()
                    .then(resolve)
                    .catch(reject);
            });
        });
    } else {
        await closeHandler();
    }
});
