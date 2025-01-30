import 'dotenv/config'
import build from 'pino-abstract-transport'
import fs from 'fs'
import { EOL } from 'os'
import { buildRootPath } from '../helpers/system'
import LogTypeFile from '../enums/LogTypeFile'

function writeToLogFile(type: LogTypeFile, logLine: string): void {
    const stream = fs.createWriteStream(buildRootPath('logs', type), { flags: 'a' })

    if (process.env.APP_DEBUG === 'true') {
        stream.on('error', (err) => {
            console.error('Error writing to ' + type + ':', err)
        })
    }

    stream.write(logLine)
}

export default async function (options = {}) {
    return build(
        async (source) => {
            for await (const obj of source) {
                const logLine: string = JSON.stringify(obj) + EOL

                if (obj.level == 30) { // info
                    writeToLogFile(LogTypeFile.info, logLine)
                } else if (obj.level >= 40) { // warn + error + fatal
                    writeToLogFile(LogTypeFile.error, logLine)
                } else {
                    writeToLogFile(LogTypeFile.debug, logLine)
                }
            }
        },
        {
            // parse: 'lines', // When parse is set to 'lines', each log entry is provided as a string
        }
    )
}
