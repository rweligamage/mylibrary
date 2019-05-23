import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Sync } from './sync';


@NgModule({
  declarations: [
    Sync,
  ],
  imports: [
      IonicPageModule.forChild(Sync),
  ],
  exports: [
    Sync
  ]
})
export class SyncModule {}
