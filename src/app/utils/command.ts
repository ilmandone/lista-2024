import { cloneDeep } from 'lodash';

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
		const d = cloneDeep(data);
		this._commandsList.push({
			redo,
			undo,
			data: d,
		});
		redo(d);
		this._commandCursor += 1;
	}
	redo() {
		if (this._commandCursor >= this._commandsList.length) return;
		const step = this._commandsList[this._commandCursor];
		step.redo(step.data);
		this._commandCursor += 1;
	}
	undo() {
		if (this._commandCursor <= 0) return;
		this._commandCursor -= 1;
		const step = this._commandsList[this._commandCursor];
		step.undo(step.data);
	}

	reset() {
		this._commandCursor = 0;
		this._commandsList = [];
	}
}
