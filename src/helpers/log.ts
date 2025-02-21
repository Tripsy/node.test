import {CallStackInterface} from '../interfaces/call-stack.interface';
import {lang} from '../config/i18n-setup.config';
import {historyLogger} from '../providers/logger.provider';

export function formatCallStack(stack: string, filtersForCallStack: string[] = []): CallStackInterface {
    const result: CallStackInterface = {
        file: 'Unknown file',
        line: 0,
        function: 'Unknown function',
        trace: [],
    };

    const combinedFilters = [...filtersForCallStack, '/node_modules', 'internal/modules'];

    let [, ...stackArray]: string[] = stack.split('\n').map(line => line.trim()); // The first line from the call stack is removed

    stackArray = stackArray.filter((item) => {
            // Check if the item contains any of the words in combinedFilters
            return !combinedFilters.some((word) => item.includes(word));
        }
    );

    if (stackArray.length > 0) {
        const match = stackArray[0].match(/at (?:([^ ]+) )?\(?(.+):(\d+):(\d+)\)?/);

        if (match) {
            const [, functionName = '<anonymous>', filePath, line] = match;

            result.file = filePath;
            result.line = parseInt(line, 10) || 0;
            result.function = functionName;
            result.trace = stackArray;
        } else {
            result.trace = stackArray;
        }
    }

    return result;
}

export function logHistory(entity: string, action: string, replacements: Record<string, string> = {}) {
    historyLogger.info(lang(`${entity}.history.${action}`, replacements));
}