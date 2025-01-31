import 'dotenv/config'
import build from 'pino-abstract-transport'
import fs, {WriteStream} from 'fs'
import {EOL} from 'os'
import {buildRootPath} from '../helpers/system'
import {LogFileTypeEnum} from '../enums/log-file-type.enum'

const logStreams: Record<string, WriteStream> = {
    info: fs.createWriteStream(buildRootPath('logs', LogFileTypeEnum.INFO), {flags: 'a'}),
    error: fs.createWriteStream(buildRootPath('logs', LogFileTypeEnum.ERROR), {flags: 'a'}),
    debug: fs.createWriteStream(buildRootPath('logs', LogFileTypeEnum.DEBUG), {flags: 'a'}),
};

export default async function (options = {}) {
    return build(
        async (source) => {
            for await (const obj of source) {
                try {
                    const logLine: string = JSON.stringify(obj) + EOL;

                    if (obj.level === 30) { // info
                        logStreams.info.write(logLine);
                    } else if (obj.level >= 40) { // warn + error + fatal
                        logStreams.error.write(logLine);
                    } else {
                        logStreams.debug.write(logLine);
                    }
                } catch (err) {
                    console.error(`Failed to log entry:`, err);
                }
            }
        },
        {
            async close() {
                // Ensure all logs are flushed before process exits
                Object.values(logStreams).forEach((stream) => stream.end());
            },
        }
    );
}
