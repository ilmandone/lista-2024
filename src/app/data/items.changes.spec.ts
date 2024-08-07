import { SetOfItemsChanges } from './items.changes';
import { BasicItemChange } from './firebase.interfaces';
import { fakeAsync, tick } from '@angular/core/testing';

interface Test extends BasicItemChange {
    value: number
}

describe('SetOfItemsChanges', () => {
  let setOfItemsChanges: SetOfItemsChanges<Test>;

  beforeEach(() => {
    setOfItemsChanges = new SetOfItemsChanges<Test>();
  });

  it('should add a created item', () => {
    const change: Test = { UUID: '1', value: 1, crud: 'create' }
    setOfItemsChanges.set([change])
    expect(setOfItemsChanges.values.created).toContain(change)
  })

  it('should add a deleted item', () => {
    const change: Test = { UUID: '1', value: 1, crud: 'delete' }
    setOfItemsChanges.set([change])
    expect(setOfItemsChanges.values.deleted).toContain(change) 
  })

  it('should add an update item', () => {
    const change: Test = { UUID: '1', value: 1, crud: 'update' }
    setOfItemsChanges.set([change])
    expect(setOfItemsChanges.values.updated).toContain(change) 
  })

  it('should update a created item', fakeAsync(() => {
    const initialChange: Test = { UUID: '1', value: 1, crud: 'create' }
    const finalChange: Test = { UUID: '1', value: 2, crud: 'update' }
    setOfItemsChanges.set([initialChange])
    tick(1000)
    setOfItemsChanges.set([finalChange])
    expect(setOfItemsChanges.values.created).toContain({...finalChange, crud: 'create'})
  }))

  it('should update an updated item', fakeAsync(() => {
    const initialChange: Test = { UUID: '1', value: 1, crud: 'update' }
    const finalChange: Test = { UUID: '1', value: 2, crud: 'update' }
    setOfItemsChanges.set([initialChange])
    tick(1000)
    setOfItemsChanges.set([finalChange])
    expect(setOfItemsChanges.values.updated).toContain(finalChange)
  }))

  it('should delete a created item', fakeAsync(() => {
    const initialChange: Test = { UUID: '1', value: 1, crud: 'create' }
    const finalChange: Test = { UUID: '1', value: 1, crud: 'delete' }
    setOfItemsChanges.set([initialChange])
    tick(1000)
    setOfItemsChanges.set([finalChange])
    expect(setOfItemsChanges.values.created.length).toHaveSize(0)
  }))

  it('should add multiple items', () => {
    const changeCreate: Test = { UUID: '1', value: 1, crud: 'create' }
    const changeUpdate: Test = { UUID: '2', value: 2, crud: 'update' }
    const changeDelete: Test = { UUID: '3', value: 3, crud: 'delete' }
    setOfItemsChanges.set([changeCreate, changeUpdate, changeDelete])
    expect(setOfItemsChanges.values.created).toContain(changeCreate)
    expect(setOfItemsChanges.values.updated).toContain(changeUpdate)
    expect(setOfItemsChanges.values.deleted).toContain(changeDelete)
  })
});