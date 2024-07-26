import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FirebaseService } from '../../data/firebase.service'
import { MatIcon } from '@angular/material/icon'
import { MatIconButton } from '@angular/material/button'
import { ItemData } from '../../data/firebase.interfaces'
import { Nullable } from '../../shared/common.interfaces'
import { LoaderComponent } from '../../components/loader/loader.component'
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet'
import {
  IListBottomSheetData,
  ListBottomSheetComponent
} from './list.bottom-sheet/list.bottom-sheet.component'

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    LoaderComponent,
    MatBottomSheetModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _firebaseSrv = inject(FirebaseService)
  private readonly _router = inject(Router)
  private readonly _bottomSheet = inject(MatBottomSheet)

  private _UUID!: string

  itemsData = signal<Nullable<ItemData[]>>([])

  label!: string
  viewModeGrid = false
  editing = false

  async ngOnInit() {
    this._UUID = this._activatedRoute.snapshot.params['id']

    const l = await this._firebaseSrv.getListLabelByUUID(this._UUID)

    // No label for this UUID -> return to main
    if (!l) void this._router.navigate(['/main'])
    else this.label = l

    this._firebaseSrv.loadList(this._UUID).then(r => {
      this.itemsData.set(r)
    })
  }

  //#region Bottom menu

  /**
   * Open the button sheet and subscribe to the dismiss event
   */
  openButtonSheet() {
    const p = this._bottomSheet.open(ListBottomSheetComponent, {
      data: {
        viewModeGrid: this.viewModeGrid
      } as IListBottomSheetData
    })

    p.afterDismissed().subscribe((r: IListBottomSheetData) => {
      Object.assign(this,  {...r})
    })
  }

  //#endregion
}
