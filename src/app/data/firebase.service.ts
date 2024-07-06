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
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'

import { environment } from 'environments/environment.development'
import { ListData, ListsData } from './firebase.interfaces'
import { IListsItemChanges } from '../pages/lists/lists.item/lists.item.component'


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

  get userData() {
    return this._userData
  }

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

  //#region DB

  getDateFromTimeStamp(timeStamp: Timestamp): Date {
    return timeStamp.toDate()
  }

  startDB() {
    if (!this._app) throw new Error('App not initialized')
    this._db = getFirestore(this._app)
  }

  /**
   * Get lists from the database
   * @returns Promise<ListsData>
   */
  async loadLists(): Promise<ListsData> {

    try {
      const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
      const q = query(mainCollection, orderBy('position'))
      const data = await getDocs(q)

      if (!data) await Promise.reject('Data not found')
      if (data.empty) return []

      const lists: ListsData = []

      data.forEach(doc => {
        lists.push(doc.data() as ListData)
      })

      console.log(lists)
      return lists

    } catch (error) {
      throw new Error(error as string)
    }
  }

  /**
   * Create, update or delete a list
   * @description On batch commit return the loadList function
   * @param {IListsItemChanges[]} changes
   * @return {Promise<ListsData>}
   */
  async updateLists(changes: IListsItemChanges[]): Promise<ListsData> {

    const batch = writeBatch(this._db)
    const mainCollection = collection(this._db, 'ListaDellaSpesaV2')

    for (const change of changes) {
      const d = doc(mainCollection, change.UUID)
      if (change.crud === 'delete')
        // TODO DELETE
        continue

      if (change.crud === 'create') {
        console.log('CREATE')
      }

      if (change.crud === 'update') {
        batch.update(d, change)
      }

      // update the data for new or updated list
      batch.update(d, { updated: serverTimestamp() })
    }

    await batch.commit()
    return this.loadLists()
  }

  //#endregion
}
