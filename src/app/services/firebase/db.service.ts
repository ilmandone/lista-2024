import { inject, Injectable } from '@angular/core';
import { ICommand } from 'app/utils/command';
import {
	collection,
	CollectionReference,
	doc,
	DocumentData,
	Firestore,
	getDocs,
	getFirestore,
	orderBy,
	query,
	Timestamp,
	writeBatch,
} from 'firebase/firestore';
import { cloneDeep } from 'lodash';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { FirebaseAuthentication } from './authe.service';

export interface IItemData {
	active: true;
	field: string;
	incart: boolean;
	label: string;
	qt: number;
}

export interface IListData {
	UUID: string;
	label: string;
	position: number;
	updated: Date;
	items: IItemData[];
}

export interface IListsData {
	data: IListData[];
	msg?: string;
}

export interface ICommandAction {
	list: IListData;
	newLabel?: string;
	originalLabel?: string;
}

@Injectable({
	providedIn: 'root',
})
export class DbService {
	private _authSrv = inject(FirebaseAuthentication);

	private _db!: Firestore;
	private _collection!: CollectionReference<DocumentData, DocumentData>;
	private _rawData!: IListsData;

	get cachedData(): IListsData {
		return cloneDeep(this._rawData);
	}

	//#region Privates
	/**
	 * Generic loader for docs in a collection
	 * @private
	 */
	private async _loadDocsFromCollection(): Promise<IListsData | unknown> {
		const data: DocumentData[] = [];

		try {
			const q = query(this._collection, orderBy('position'));
			const dbDocs = await getDocs(q);

			dbDocs.forEach((doc) => {
				const docData = doc.data();
				data.push(docData);
			});

			return { data };
		} catch (error) {
			return error;
		}
	}

	private _generateUUID(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
			/[xy]/g,
			function (c) {
				const r = (Math.random() * 16) | 0,
					v = c == 'x' ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			},
		);
	}
	//#endregion

	/**
	 * Returns a generated UUID.
	 * @return {string} the generated UUID
	 */
	getUUID(): string {
		return this._generateUUID();
	}

	/**
	 * Init the db references
	 */
	init() {
		const app = this._authSrv.app;
		this._db = getFirestore(app);
		this._collection = collection(this._db, 'ListaDellaSpesaV2');
	}

	/**
	 * Load all lists
	 */
	loadLists(): Observable<IListsData> {
		return from(this._loadDocsFromCollection()).pipe(
			map((r) => {
				// Convert timestamp to Date
				(r as IListsData).data.forEach((list: IListData) => {
					list.updated = (
						list.updated as unknown as Timestamp
					).toDate();
				});

				this._rawData = cloneDeep(r as IListsData);

				return r;
			}),
		) as Observable<IListsData>;
	}

	crudOnLists(
		commandList: ICommand[],
		dataList: IListsData,
	): Observable<IListsData> {
		const batch = writeBatch(this._db);

		if (commandList.length > 0) {
			const UUIDS: string[] = [];

			commandList.forEach((c) => {
				const cUUID = (c.data as ICommandAction).list.UUID;
				const ref = doc(this._collection, cUUID);
				switch (c.type) {
					case 'set':
					case 'update':
						batch.set(ref, (c.data as ICommandAction).list);
						break;
					case 'delete':
						batch.delete(ref);
						break;
				}

				c.type !== 'update' && UUIDS.push(cUUID);
			});

			// Update lists positions for non edited items
			dataList.data
				.filter((d) => !UUIDS.includes(d.UUID))
				.forEach((d) => {
					const ref = doc(this._collection, d.UUID);
					batch.update(ref, {
						position: d.position,
					});
				});

			return from(batch.commit()).pipe(
				catchError(() =>
					of({
						data: this._rawData.data,
						msg: 'Cancellazione fallita',
					}),
				),
				switchMap(() => this.loadLists()),
			);
		} else {
			return of({
				data: this._rawData.data,
				msg: 'Nessun comando elaborato',
			});
		}
	}
}
