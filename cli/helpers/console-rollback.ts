import { display } from './console-display';
import { logToFile } from './console-log';

type UndoStep = {
	description: string;
	action: () => Promise<void>;
	data?: Record<string, unknown>;
};

type UndoStepExecuted = {
	description: string;
	success: boolean;
	error?: unknown;
};

export class ConsoleRollback {
	private steps: UndoStep[] = [];
	private stepsExecuted: UndoStepExecuted[] = [];

	constructor(private readonly historyFilePath: string) {}

	addUndoStep(step: UndoStep): void {
		this.steps.push(step);
	}

	addExecutedStep(step: UndoStepExecuted): void {
		this.stepsExecuted.push(step);
	}

	async process(): Promise<void> {
		if (this.steps.length === 0) {
			return;
		}

		display.text(`Rolling back`, 'arrow');

		for (const step of this.steps) {
			try {
				await display.withDots(step.description, async () => {
					await step.action();

					this.addExecutedStep({
						...step,
						success: true,
					});

					return `${step.description} ...done`;
				});
			} catch (error) {
				if (error instanceof Error) {
					const errorMessage = error.message || 'Unknown error';

					display
						.error(`${step.description} ...failed`)
						.error(errorMessage);

					this.addExecutedStep({
						description: step.description,
						success: false,
						error: errorMessage,
					});
				} else {
					console.error(error);

					this.addExecutedStep({
						description: step.description,
						success: false,
						error: error,
					});
				}
			}
		}

		void this.save();

		if (this.stepsExecuted.filter((s) => s.success === false).length > 0) {
			display.warning(
				`Rolling back finished but encountered some errors`,
			);
		} else {
			display.text(`Rolling back completed`);
		}
	}

	async save(): Promise<void> {
		const logEntry = JSON.stringify(this.stepsExecuted, null, 2);

		void logToFile(logEntry, this.historyFilePath);
	}
}
