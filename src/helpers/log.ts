import Logger from 'pino'
import ICallStack from '../interfaces/call-stack.interface'

export function childLogger(logger: Logger, category: string) {
    return logger.child({
        category: category
    })
}

export function formatCallStack(callStack: string, filtersForCallStack: string[] = []): ICallStack {
    let result: ICallStack = {
        file: 'Unknown file',
        line: 0,
        function: 'Unknown function',
        trace: [],
    }

    filtersForCallStack = [...filtersForCallStack, '/node_modules', 'internal/modules']

    let [, ...stackArray]: string[] = callStack.split('\n').map(line => line.trim()) // The first line from the call stack is removed

    stackArray = stackArray.filter((item) => {
            // Check if the item contains any of the words in this.filtersForCallStack
            return !filtersForCallStack.some((word) => item.includes(word))
        }
    )

    if (stackArray.length > 0) {
        const match = stackArray[0].match(/at (?:([^ ]+) )?\(?(.+):(\d+):(\d+)\)?/)

        if (match) {
            const [, functionName = '<anonymous>', filePath, line] = match

            result.file = filePath
            result.line = parseInt(line, 10)
            result.function = functionName
            result.trace = stackArray
        } else {
            result.trace = stackArray
        }
    }

    return result
}
