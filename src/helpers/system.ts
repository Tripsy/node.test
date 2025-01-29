import 'dotenv/config'
import path from 'path'

export function buildSrcPath(...args: string[]) {
    return path.join(process.env.SRC_PATH, ...args)
}
