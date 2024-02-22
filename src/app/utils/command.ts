import {cloneDeep} from 'lodash';

export interface ICommand {
	data: unknown;
	undo: (p?: unknown) => void;
	redo: (p?: unknown) => void;
	type: CommandType;
}

export type CommandType = 'set' | 'delete' | 'update';

export class Command {
	private _commandsList: ICommand[] = [];
	private _commandCursor = 0;

	getCommands() {
		return this._commandsList;
	}

	execute(
		type: CommandType,
		redo: (p?: unknown) => void,
		undo: (p?: unknown) => void,
		data: unknown,
	) {
		const d = cloneDeep(data);
		if (this._commandCursor <= this._commandsList.length - 1) {
			this._commandsList.splice(this._commandCursor);
		}
		this._commandsList.push({
			redo,
			undo,
			data: d,
			type,
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
