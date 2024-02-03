import { Injectable, inject } from '@angular/core';
import { FirebaseAuthentication } from './authe.service';
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

@Injectable({
	providedIn: 'root',
})
export class DbService {
	private _autheSrv = inject(FirebaseAuthentication);

	private _db!: Firestore;
	private _collection!: CollectionReference<DocumentData, DocumentData>;
	constructor() {}

	private async _loadDocsFromCollection(): Promise<
		{ data: DocumentData[] } | unknown
	> {
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
		const app = this._autheSrv.app;
		this._db = getFirestore(app);
		this._collection = collection(this._db, 'ListaDellaSpesaV2');
	}

	loadLists() {
		this._loadDocsFromCollection().then((r) => console.log(r));
	}
}
