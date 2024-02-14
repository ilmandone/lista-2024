import { Injectable, inject } from '@angular/core';
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
} from 'firebase/firestore';
import {
	Observable,
	catchError,
	from,
	map,
	of,
	switchMap,
	throwError,
} from 'rxjs';
import { FirebaseAuthentication } from './authe.service';
import { cloneDeep } from 'lodash';

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
	items: IItemData;
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
		return this._rawData;
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
	 * Create the new list and return the updated lists
	 * @param {string} newListUUID
	 * @param {string} newListLabel
	 * @returns
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

	createList(name: string): Observable<IListsData> {
		// Load all lists and align internal data
		return this.loadLists().pipe(
			// Check if the list name exists
			switchMap((r) => {
				const newListUUID = this._generateUUID();
				const newListLabel =
					name.charAt(0).toUpperCase() + name.toLowerCase().slice(1);

				if (r.data.some((d) => d.label === newListLabel)) {
					return throwError(() => {
						return {
							data: this._rawData.data,
							msg: 'Esiste già una lista con questo nome',
						};
					});
				}

				// Create the new list
				return this._createNewListInCollection(
					newListUUID,
					newListLabel,
				);
			}),
		);
	}
}
