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

import { Firestore, getFirestore, getDoc, doc } from 'firebase/firestore'

import { environment } from 'environments/environment.development'

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

  private async _getDoc() {
    return await getDoc(doc(this._db, 'ListaDellaSpesaV2', 'ListaDellaSpesaV2'))
  }

  startDB() {
    if (!this._app) throw new Error('App not initialized')
    this._db = getFirestore(this._app)
  }

  async loadLists() {
    try {
      const doc = await this._getDoc()
      if (doc.exists()) return doc.data()
      else throw new Error('Doc not found')
    } catch (error) {
      throw new Error(error as string)
    }
  }

  //#endregion
}
