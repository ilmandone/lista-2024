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
} from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
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
	positin: number;
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
	constructor() {}

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

	init() {
		const app = this._authSrv.app;
		this._db = getFirestore(app);
		this._collection = collection(this._db, 'ListaDellaSpesaV2');
	}

	loadLists(): Observable<IListsData> {
		return from(this._loadDocsFromCollection()).pipe(
			map((r) => {
				// Convert timestamp to Date
				(r as IListsData).data.forEach((list: IListData) => {
					list.updated = (
						list.updated as unknown as Timestamp
					).toDate();
				});

				return r;
			}),
		) as Observable<IListsData>;
	}
}
