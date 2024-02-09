import { Injectable, inject } from '@angular/core';
import {
	CollectionReference,
	DocumentData,
	Firestore,
	Timestamp,
	collection,
	getDocs,
	getFirestore,
	orderBy,
	query,
	doc,
	setDoc,
	serverTimestamp
} from 'firebase/firestore';
import {Observable, from, map, catchError, of, switchMap} from 'rxjs';
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
	items: IItemData;
}

export interface IListsData {
	data: IListData[];
}

@Injectable({
	providedIn: 'root',
})
export class DbService {
	private _authSrv = inject(FirebaseAuthentication);

	private _db!: Firestore;
	private _collection!: CollectionReference<DocumentData, DocumentData>;
	private _rawData!: IListsData
	constructor() {}

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
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
			.replace(/[xy]/g, function (c) {
				const r = Math.random() * 16 | 0,
					v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
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

				this._rawData = r as IListsData
				return r;
			}),
		) as Observable<IListsData>;
	}

	createList(name: string): Observable<IListsData> {
		const newListUUID = this._generateUUID()
		const newListLabel = name.charAt(0).toUpperCase() + name.toLowerCase().slice(1)

		return from(setDoc(doc(this._collection, newListUUID), {
			label: newListLabel,
			items: [],
			position: this._rawData.data.length,
			updated: serverTimestamp()
		})).pipe(
			// On error return the cached data
			catchError(() => of(this._rawData)),
			// On success load the lists and return the observable
			switchMap(() => this.loadLists()
			)
		)
	}
}
