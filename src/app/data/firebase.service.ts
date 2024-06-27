import { Injectable, signal } from '@angular/core'
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app'
import {
  Auth,
  UserCredential,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'

import { Firestore, collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore'

import { environment } from 'environments/environment.development'
import { ListData, ListsData } from './firebase.interfaces'
import { Nullable } from 'app/shared/common.interfaces'

export interface IIsLogged {
  state: boolean | null
  error?: string
}

export type IResetPsw = IIsLogged

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
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

  public isLogged = signal<IIsLogged>({ state: false })

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

  startDB() {
    if (!this._app) throw new Error('App not initialized')
    this._db = getFirestore(this._app)
  }

  /**
   * Get lists from the database
   * @returns Promise<ListsData>
   */
  async loadLists():Promise<Nullable<ListsData>> {

    try {
      const mainCollection = collection(this._db, 'ListaDellaSpesaV2')
      const q = query(mainCollection, orderBy('position'))
      const data = await getDocs(q)

      if(!data) throw Error('Data not found')      
      if(data.empty) return null

      const lists: ListsData = []      

      data.forEach(doc => {                
        lists.push(doc.data() as ListData)
      })

      return null// lists
      
    } catch (error) {
      throw new Error(error as string)
    }
  }

  //#endregion
}
