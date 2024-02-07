import { Injectable, inject } from '@angular/core';
import {
	CollectionReference,
	DocumentData,
	Firestore,
	collection,
	getDocs,
	getFirestore,
	orderBy,
	query,
} from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { FirebaseAuthentication } from './authe.service';

export interface DocumentsData {
	data: DocumentData[];
}

@Injectable({
	providedIn: 'root',
})
export class DbService {
	private _authSrv = inject(FirebaseAuthentication);

	private _db!: Firestore;
	private _collection!: CollectionReference<DocumentData, DocumentData>;
	constructor() {}

	private async _loadDocsFromCollection(): Promise<DocumentsData | unknown> {
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

	loadLists(): Observable<DocumentsData> {
		return from(
			this._loadDocsFromCollection(),
		) as Observable<DocumentsData>;
	}
}
