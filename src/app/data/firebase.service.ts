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
import { EditBag, IListsItemChanges, ItemData, ListData, ListsData } from './firebase.interfaces'

import { Nullable } from '../shared/common.interfaces'

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

	//#region DB Lists

	/**
	 * Keep only last changes for each list
	 * @param {IListsItemChanges} changes
	 * @private
	 */
	optimizeListsChanges(changes: IListsItemChanges[]): IListsItemChanges[] {
		const matchedUUID = new Set<string>()

		return changes.reduceRight((acc, val) => {
			if (!matchedUUID.has(val.UUID)) {
				matchedUUID.add(val.UUID)
				acc.push(val)
			}

			return acc
		}, [] as IListsItemChanges[])
	}

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
	 * @param {IListsItemChanges[]} changes
	 * @return {Promise<ListsData>}
	 */
	async updateLists(changes: EditBag<IListsItemChanges>): Promise<ListsData> {
		if (!this._db) this._startDB()

		const batch = writeBatch(this._db)
		const mainCollection = collection(this._db, 'ListaDellaSpesaV2')

    // Create
    for (const create of changes.created) {
      const d = doc(mainCollection, create.UUID)
      batch.set(d,  {
        label: create.label,
        position: create.position,
        UUID: create.UUID,
        updated: this.gewNewTimeStamp()
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
	}

	//#endregion

	//#region DB List

	async loadList(UUID: string): Promise<ItemData[]> {
		try {
			if (!this._db) this._startDB()

			const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
			const list = doc(mainCollection, UUID)
			const itemsData = collection(list, 'items')

			const data = await getDocs(itemsData)
      if (!data) await Promise.reject('Data not found')
      if (data.empty) return []

      const items: ItemData[] = []

      data.forEach((doc) => {
        items.push(doc.data() as ItemData)
      })

      return items

		} catch (error) {
			this._cachedList = undefined
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
