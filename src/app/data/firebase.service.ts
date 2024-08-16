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
	doc,
	Firestore,
	getDocs,
	getFirestore,
	orderBy,
	query,
	Timestamp,
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
	GroupData
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

	private _startDB() {
		if (!this._app) throw new Error('App not initialized')
		this._db = getFirestore(this._app)
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
		try {
			if (!this._db) this._startDB()

			const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
			const q = query(mainCollection, orderBy('position'))
			const data = await getDocs(q)

			if (!data) await Promise.reject('Data not found')
			if (data.empty) return []

			const lists: ListsData = []

			data.forEach((doc) => {
				lists.push(doc.data() as ListData)
			})

			// Save cache
			this._cachedList = lists

			return lists
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
			const mainCollection = collection(this._db, 'ListaDellaSpesaV2')

			// Create
			for (const create of changes.created) {
				const d = doc(mainCollection, create.UUID)
				batch.set(d, {
					label: create.label,
					position: create.position,
					UUID: create.UUID,
					updated: this.gewNewTimeStamp()
				})

				// Items
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

			// Delete
			for (const del of changes.deleted) {
				const d = doc(mainCollection, del.UUID)
				batch.delete(d)
			}

			// Update
			for (const up of changes.updated) {
				const d = doc(mainCollection, up.UUID)
				batch.update(d, up)
			}

			await batch.commit()
			return this.loadLists()
		} catch (error) {
			throw new Error(error as string)
		}
	}

	//#endregion

	//#region DB List

	async loadList(UUID: string): Promise<ItemsData> {
		try {
			if (!this._db) this._startDB()

			const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
			const list = doc(mainCollection, UUID)
			const itemsCollection = collection(list, 'items')
			const q = query(itemsCollection, orderBy('position'))

			const data = await getDocs(q)
			if (!data) await Promise.reject('Data not found')
			if (data.empty) return []

			const items: ItemData[] = []

			data.forEach((doc) => {
				items.push(doc.data() as ItemData)
			})

			return items
		} catch (error) {
			throw new Error(error as string)
		}
	}

	async updateList(changes: EditBag<ItemsChanges>, UUID: string): Promise<ItemsData> {
		try {
			if (!this._db) this._startDB()

			const batch = writeBatch(this._db)
			const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
			const list = doc(mainCollection, UUID)
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

			// Delete
			for (const del of changes.deleted) {
				const d = doc(itemsCollection, del.UUID)
				batch.delete(d)
			}

			// Update
			for (const up of changes.updated) {
				const d = doc(itemsCollection, up.UUID)
				batch.update(d, up)
			}

			await batch.commit()
			return this.loadList(UUID)
		} catch (error) {
			throw new Error(error as string)
		}
	}

	//#endregion

	//#region Groups

	public async loadGroups(useCache= false): Promise<GroupsData> {
		try {
			if (!this._db) this._startDB()

			if(useCache && this._cachedGroups) return this._cachedGroups

			const mainCollection = collection(this._db, 'ListaDellaSpesaV2-Groups')
			const q = query(mainCollection, orderBy('position'))
			const data = await getDocs(q)

			if (!data) await Promise.reject('Data not found')
			if (data.empty) return []

			const groups: GroupsData = []

			data.forEach((doc) => {
				groups.push(doc.data() as GroupData)
			})

			// Save cache
			this._cachedGroups = groups

			return groups
		} catch (error) {
			this._cachedGroups = undefined
			throw new Error(error as string)
		}
	}


	//#endregion

	//#region Utils

	async getListLabelByUUID(UUID: string): Promise<Nullable<string>> {
		if (this._cachedList === undefined) {
			await this.loadLists()
		}

		return this._cachedList?.find((list) => list.UUID === UUID)?.label ?? null
	}

	//#endregion
}
