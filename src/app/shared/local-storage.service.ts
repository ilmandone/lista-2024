import {Injectable} from '@angular/core';
import {Nullable} from "./utils";

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  getValue(id: string): Nullable<string> {
    return window.localStorage.getItem(id) ?? null;
  }

  setValue(id: string, value: string): void {
    window.localStorage.setItem(id, value);
  }

  clearValue(id: string): void {
    window.localStorage.removeItem(id);
  }
}
