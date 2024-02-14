export interface ICommand {
	data: unknown;
	undo: (p?: unknown) => void;
	redo: (p?: unknown) => void;
}

export class Command {
	private _commandsList: ICommand[] = [];
	private _commandCursor = 0;

	constructor() {}
	execute(
		redo: (p?: unknown) => void,
		undo: (p?: unknown) => void,
		data: unknown,
	) {
		this._commandsList.push({
			redo,
			undo,
			data,
		});
		redo(data);
	}
	redo() {
		if (this._commandCursor > this._commandsList.length - 1) return;
		this._commandCursor += 1;
		const step = this._commandsList[this._commandCursor];
		step.redo(step.data);
	}
	undo() {
		if (this._commandCursor < 0) return;
		const step = this._commandsList[this._commandCursor];
		step.undo(step.data);
		this._commandCursor -= 1;
	}
}
