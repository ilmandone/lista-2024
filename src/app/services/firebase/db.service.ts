import { Injectable, inject } from '@angular/core';
import { ICommand } from 'app/utils/command';
import {
	CollectionReference,
	DocumentData,
	Firestore,
	Timestamp,
	collection,
	doc,
	getDocs,
	getFirestore,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	writeBatch,
} from 'firebase/firestore';
import { cloneDeep } from 'lodash';
import { Observable, catchError, from, map, of, switchMap } from 'rxjs';
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

	/**
	 * Delete item from collection
	 * @param {string} UUID
	 * @private
	 * @deprecated
	 */
	private async _deleteItemFromCollection(
		UUID: string,
	): Promise<IListsData | unknown> {
		const batch = writeBatch(this._db);

		let idOffset = 0;

		this._rawData.data.forEach((element, index) => {
			const ref = doc(this._collection, element.UUID);
			if (UUID === element.UUID) {
				batch.delete(ref);
				idOffset += 1;
			} else {
				batch.update(ref, { position: index - idOffset });
			}
		});

		return batch.commit();
	}

	/**
	 * Create the new list and return the updated lists
	 * @param {string} newListUUID
	 * @param {string} newListLabel
	 * @returns
	 * @deprecated
	 */
	private _createNewListInCollection(
		newListUUID: string,
		newListLabel: string,
	): Observable<IListsData> {
		return from(
			setDoc(doc(this._collection, newListUUID), {
				label: newListLabel,
				items: [],
				position: this._rawData.data.length,
				updated: serverTimestamp(),
				UUID: newListUUID,
			}),
		).pipe(
			// On error return the cached data
			catchError(() =>
				of({
					data: this._rawData.data,
					msg: 'Errore di connessione - Riprova',
				}),
			),
			// On success load the lists and return the observable
			switchMap(() => this.loadLists()),
		);
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
				const cUUID = (c.data as IListData).UUID;
				const ref = doc(this._collection, cUUID);
				switch (c.type) {
					case 'set':
					case 'update':
						batch.set(ref, c.data as IListData);
						UUIDS.push(cUUID);
						break;
					case 'delete':
						batch.delete(ref);
						UUIDS.push(cUUID);
						break;
				}
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
