import { Injectable, signal } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class MainLoaderService {
  showLoader = signal<boolean>(false)
}
