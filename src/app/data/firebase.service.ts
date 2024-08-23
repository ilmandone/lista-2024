import { Injectable, signal } from '@angular/core'
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app'
import {
	Auth,
	getAuth,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	UserCredential
} from 'firebase/auth'

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
	WriteBatch,
	writeBatch
} from 'firebase/firestore'

import { environment } from 'environments/environment.development'
import {
	EditBag,
	ListsItemChanges,
	ItemData,
	ListData,
	ListsData,
	ItemsChanges,
	ItemsData,
	GroupsData,
	GroupData,
	GroupChanges,
	BasicItemChange
} from './firebase.interfaces'
import { Nullable } from '../shared/common.interfaces'
import { v4 as uuidV4 } from 'uuid'

export interface IIsLogged {
	state: boolean | null
	error?: string
}

export type IResetPsw = IIsLogged

@Injectable({
	providedIn: 'root'
})
export class FirebaseService {
	public isLogged = signal<IIsLogged>({ state: false })
	private _env = environment as Record<string, string>
	private _fireBaseOptions: FirebaseOptions = {
		authDomain: this._env['AUTH_DOMAIN'],
		apiKey: this._env['API_KEY'],
		databaseURL: this._env['DATABASE_URL'],
		projectId: this._env['PROJECT_ID'],
		storageBucket: this._env['STORAGE_BUCKET'],
		messagingSenderId: this._env['MESSAGING_SENDER_ID'],
		appId: this._env['APP_ID']
	}
	private _app!: FirebaseApp
	private _auth!: Auth
	private _db!: Firestore
	private _userData!: UserCredential

	private _cachedList!: ListsData | undefined
	private _cachedGroups!: GroupsData | undefined

	/**
	 * Start the firebase connection
	 */
	public start(): Promise<void> {
		return new Promise((resolve) => {
			this._app = initializeApp(this._fireBaseOptions)
			this._auth = getAuth(this._app)

			// Listen logout / login
			this._auth.onAuthStateChanged((event) => {
				this.isLogged.set({ state: event != null })
				resolve()
			})
		})
	}

	//#region Authentication

	/**
	 * Login with email and password
	 * @param {string} email
	 * @param {string} password
	 * @return Promise<void>
	 */
	login(email: string, password: string): Promise<void> {
		return signInWithEmailAndPassword(this._auth, email, password)
			.then((resp) => {
				this._userData = resp
				this.isLogged.set({ state: true })
				return
			})
			.catch((error) => {
				this.isLogged.set({ state: false, error: error.code })
				throw new Error(error)
			})
	}

	/**
	 * Logout
	 * @return Promise<void>
	 */
	logout(): Promise<void> {
		return signOut(this._auth)
			.then(() => {
				this.isLogged.set({ state: false })
				return
			})
			.catch((error) => {
				throw new Error(error)
			})
	}

	/**
	 * Reset account with email
	 * @param {string} email
	 * @returns {Promise<void>}
	 */
	resetWithPassword(email: string): Promise<void> {
		return sendPasswordResetEmail(this._auth, email)
	}

	//#endregion

	//#region DB Commons

	/**
	 * Initializes the Firestore database connection.
	 * @throws {Error} If the Firebase app is not initialized.
	 * @return {void}
	 */
	private _startDB(): void {
		if (!this._app) throw new Error('App not initialized')
		this._db = getFirestore(this._app)
	}

	
	/**
	 * Batch deletes and updates documents in the specified collection.
	 * @param {WriteBatch} batch
	 * @param {EditBag<T>} changes
	 * @param {CollectionReference<DocumentData, DocumentData>} collection
	 * @return {void}
	 */
	private _batchDeleteUpdate<T extends BasicItemChange>(
		batch: WriteBatch,
		changes: EditBag<T>,
		collection: CollectionReference<DocumentData, DocumentData>
	): void {
		// Delete
		for (const del of changes.deleted) {
			const d = doc(collection, del.UUID)
			batch.delete(d)
		}

		// Update
		for (const up of changes.updated) {
			const d = doc(collection, up.UUID)
			batch.update(d, up)
		}
	}

	getDateFromTimeStamp(timeStamp: Timestamp): Date {
		return timeStamp.toDate()
	}

	gewNewTimeStamp(): Timestamp {
		return Timestamp.now()
	}

	//#endregion

	//#region Lists

	/**
	 * Get lists from the database
	 * @description Save the list in cache for list pages
	 * @returns Promise<ListsData>
	 */
	async loadLists(): Promise<ListsData> {
		if (!this._db) this._startDB()

		const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
		const q = query(mainCollection, orderBy('position'))

		try {
			const data = await getDocs(q)

			if (data.empty) return []

			// Get data as cached
			this._cachedList = data.docs.map((doc) => doc.data() as ListData)
			return this._cachedList
		} catch (error) {
			this._cachedList = undefined
			throw new Error(error as string)
		}
	}

	/**
	 * update or delete a list
	 * @description On batch commit return the loadList function
	 * @param {ListsItemChanges[]} changes
	 * @return {Promise<ListsData>}
	 */
	async updateLists(changes: EditBag<ListsItemChanges>): Promise<ListsData> {
		try {
			if (!this._db) this._startDB()

			const batch = writeBatch(this._db)
			const listsCollection = collection(this._db, 'ListaDellaSpesaV2')

			// Create
			for (const create of changes.created) {
				const d = doc(listsCollection, create.UUID)
				batch.set(d, {
					label: create.label,
					position: create.position,
					UUID: create.UUID,
					updated: this.gewNewTimeStamp()
				})

				// Create sub items
				const itemCollection = collection(d, 'items')
				const UUIDItem = uuidV4()
				const itemDoc = doc(itemCollection, UUIDItem)

				batch.set(itemDoc, {
					UUID: UUIDItem,
					inCart: false,
					label: 'Hello',
					qt: 1,
					toBuy: true,
					group: null, // TODO: set to default group
					position: 0
				})
			}

			// Add update and delete to write batch
			this._batchDeleteUpdate<ListsItemChanges>(batch, changes, listsCollection)

			await batch.commit()
			return this.loadLists()
		} catch (error) {
			throw new Error(error as string)
		}
	}

	//#endregion

	//#region DB List

	/**
	 * Loads a list of items from the database.
	 * @param {string} UUID
	 * @return {Promise<ItemsData>}
	 */
	async loadList(UUID: string): Promise<ItemsData> {
		if (!this._db) this._startDB()

		const itemsCollection = collection(this._db, 'ListaDellaSpesaV2', UUID, 'items')
		const q = query(itemsCollection, orderBy('position'))

		try {
			const data = await getDocs(q)
			if (data.empty) return []

			return data.docs.map((doc) => doc.data() as ItemData)
		} catch (error) {
			throw new Error(error as string)
		}
	}

	/**
	 * Updates a list of items in the database.
	 * @param {EditBag<ItemsChanges>} changes
	 * @param {string} UUID
	 * @return {Promise<ItemsData>}
	 */
	async updateList(changes: EditBag<ItemsChanges>, UUID: string): Promise<ItemsData> {
		try {
			if (!this._db) this._startDB()

			const batch = writeBatch(this._db)
			const listsCollection = collection(this._db, 'ListaDellaSpesaV2')
			const list = doc(listsCollection, UUID)
			const itemsCollection = collection(list, 'items')

			// Create
			for (const create of changes.created) {
				const d = doc(itemsCollection, create.UUID)
				batch.set(d, {
					UUID: create.UUID,
					inCart: false,
					label: create.label,
					qt: 1,
					toBuy: true,
					group: create.group,
					position: create.position
				})
			}

			// Add update and delete to write batch
			this._batchDeleteUpdate<ItemsChanges>(batch, changes, itemsCollection)

			await batch.commit()
			return this.loadList(UUID)
		} catch (error) {
			throw new Error(error as string)
		}
	}

	//#endregion

	//#region Groups

	/**
	 * Loads groups from the database.
	 * @param {boolean} useCache
	 * @return {Promise<GroupsData>}
	 */
	public async loadGroups(useCache = false): Promise<GroupsData> {
		if (!this._db) this._startDB()
		if (useCache && this._cachedGroups) return Promise.resolve(this._cachedGroups)

		const mainCollection = collection(this._db, 'ListaDellaSpesaV2-Groups')
		const q = query(mainCollection, orderBy('position'))

		try {
			const data = await getDocs(q)
			if (data.empty) return []

			// Save cache
			this._cachedGroups = data.docs.map((doc) => doc.data() as GroupData)
			return this._cachedGroups
		} catch (error) {
			this._cachedGroups = undefined
			throw new Error(error as string)
		}
	}

	/**
	 * Updates a group in the database.
	 * @param {EditBag<GroupChanges>} changes
	 * @return {Promise<GroupsData>}
	 */
	async updateGroup(changes: EditBag<GroupChanges>): Promise<GroupsData> {
		try {
			if (!this._db) this._startDB()

			const batch = writeBatch(this._db)
			const groupCollection = collection(this._db, 'ListaDellaSpesaV2-Groups')

			// Create
			for (const create of changes.created) {
				const d = doc(groupCollection, create.UUID)
				batch.set(d, {
					label: create.label,
					position: create.position,
					UUID: create.UUID,
					color: create.color,
					updated: this.gewNewTimeStamp()
				})
			}

			// Add update and delete to write batch
			this._batchDeleteUpdate<GroupChanges>(batch, changes, groupCollection)

			await batch.commit()
			return this.loadGroups()
		} catch (error) {
			throw new Error(error as string)
		}
	}

	//#endregion

	//#region Utils

	/**
	 * Retrieves the label of a list by its UUID from the cached list data.
	 * @param {string} UUID - The UUID of the list.
	 * @return {Promise<Nullable<string>>} A promise that resolves to the label of the list if found, otherwise null.
	 */
	async getListLabelByUUID(UUID: string): Promise<Nullable<string>> {
		if (this._cachedList === undefined) {
			await this.loadLists()
		}

		return this._cachedList?.find((list) => list.UUID === UUID)?.label ?? null
	}

	//#endregion
}
