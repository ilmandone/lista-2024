import { Injectable, Injector, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
	getAuth,
	type Auth,
	signInWithEmailAndPassword,
	signOut,
} from 'firebase/auth';
import { Nullable } from 'primeng/ts-helpers';

interface IFirebaseConfig {
	apiKey: string;
	authDomain: string;
	databaseURL: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthentication {
	private _firebaseAppConfig!: IFirebaseConfig;
	private _app!: FirebaseApp;
	private _auth!: Auth;

	public isLoggedIn = signal<Nullable<boolean>>(null);

	constructor(private _injector: Injector) {
		this._firebaseAppConfig = {
			apiKey: environment.firebase_keys.APIKEY,
			appId: environment.firebase_keys.APP_ID,
			authDomain: environment.firebase_keys.AUTH_DOMAIN,
			databaseURL: environment.firebase_keys.DATABASE_URL,
			messagingSenderId: environment.firebase_keys.MESSAGING_SENDER_ID,
			projectId: environment.firebase_keys.PROJECT_ID,
			storageBucket: environment.firebase_keys.STORAGE_BUCKET,
		};
	}

	init() {
		this._app = initializeApp(this._firebaseAppConfig);
		this._auth = getAuth(this._app);

		// Listen the auth state change and update the logged in signal
		this._auth.onAuthStateChanged((e) => {
			console.log(e);
			this.isLoggedIn.set(e != null);
		});
	}

	async login(email: string, password: string) {
		if (!this._auth) this.init();
		return signInWithEmailAndPassword(this._auth, email, password);
	}

	async logout() {
		if (!this._auth) this.init();
		return signOut(this._auth);
	}
}
