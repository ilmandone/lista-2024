import { Injectable, Injector, inject } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
	getAuth,
	signInWithEmailAndPassword,
	signOut,
	type Auth,
} from 'firebase/auth';
import { Nullable } from 'primeng/ts-helpers';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from '../_common/local-storage.service';

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
	private _localStorageSrv = inject(LocalStorageService);

	private _isLoggedIn!: Nullable<boolean>;
	private _userEmail: string = '';

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

	get isLoggedIn() {
		return this._isLoggedIn;
	}

	get userEmail() {
		if (!this._app) throw new Error('Firebase app not initialized');
		if (!this._userEmail) {
			const storedData = this._localStorageSrv.get('authe');
			if (storedData) {
				this._userEmail = JSON.parse(storedData).user;
			}
		}

		return this._userEmail;
	}

	// Return the firebase application
	get app() {
		if (!this._app) throw new Error('Firebase app not initialized');
		return this._app;
	}

	get auth() {
		if (!this._auth) throw new Error('Firebase auth not initialized');
		return this._auth;
	}

	/**
	 *
	 */
	init() {
		this._app = initializeApp(this._firebaseAppConfig);
		this._auth = getAuth(this._app);

		// Listen the auth state change and update the logged in signal
		this._auth.onAuthStateChanged((e) => {
			this._isLoggedIn = e != null;
		});
	}

	async login(email: string, password: string) {
		if (!this._auth) this.init();
		return signInWithEmailAndPassword(this._auth, email, password).then(
			(r) => {
				this._userEmail = email;
				const data = {
					user: email,
					ref: r.user.uid,
				};
				this._localStorageSrv.set('authe', JSON.stringify(data));
			},
		);
	}

	async logout() {
		if (!this._auth) this.init();
		this._localStorageSrv.delete('authe');
		return signOut(this._auth);
	}
}
