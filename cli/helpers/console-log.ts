import fs from 'node:fs/promises';

export async function logToFile(message: string, filePath: string) {
	const timestamp = new Date()
		.toISOString()
		.replace('T', ' ')
		.substring(0, 19);

	const logEntry = `${timestamp} ${message}\n`;

	await fs.appendFile(filePath, logEntry);
}
