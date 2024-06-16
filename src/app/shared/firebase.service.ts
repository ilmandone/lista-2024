import {Injectable, signal} from '@angular/core';
import {FirebaseApp, FirebaseOptions, initializeApp} from 'firebase/app';
import {Auth, getAuth, signInWithEmailAndPassword, signOut, UserCredential,} from 'firebase/auth';

import {environment} from 'environments/environment.development';
import {Observable} from "rxjs";

export interface IIsLogged {
  state: boolean | null;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private _env = environment as { [key: string]: string };
  private _fireBaseOptions: FirebaseOptions = {
    authDomain: this._env['AUTH_DOMAIN'],
    apiKey: this._env['API_KEY'],
    databaseURL: this._env['DATABASE_URL'],
    projectId: this._env['PROJECT_ID'],
    storageBucket: this._env['STORAGE_BUCKET'],
    messagingSenderId: this._env['MESSAGING_SENDER_ID'],
    appId: this._env['APP_ID'],
  };

  private _app!: FirebaseApp;
  private _auth!: Auth;
  private _userData!: UserCredential;

  public isLogged = signal<IIsLogged>({state: false});

  get userData() {
    return this._userData;
  }


  public start():Observable<boolean> {
    return new Observable((subscriber) => {
      this._app = initializeApp(this._fireBaseOptions);
      this._auth = getAuth(this._app);

      // Listen logout / login
      this._auth.onAuthStateChanged((event) => {
        this.isLogged.set({state: event != null})
        subscriber.next(true)
        subscriber.complete()
      })
    })
  }

  login(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      signInWithEmailAndPassword(this._auth, email, password)
        .then((resp) => {
          this._userData = resp;
          this.isLogged.set({state: true});
          resolve()
        })
        .catch((err) => {
          this.isLogged.set({state: false, error: err.code})
        });
    })

  }

  logout(): Promise<void> {
    return new Promise((resolve, reject) => {
      signOut(this._auth).then(() => {
        this.isLogged.set({state: false});
        resolve()
      })
    })
  }
}
