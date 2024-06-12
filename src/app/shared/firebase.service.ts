import { Injectable } from '@angular/core';
import { appConfig } from 'app/app.config';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

import { environment } from 'environments/environment.development';

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
  private _auth!: Auth

  get auth() {
    return this._auth
  }

  public init() {
    if (!this._app) {
      this._app = initializeApp(this._fireBaseOptions);
      this._auth = getAuth(this._app);
    }    
  }
}
