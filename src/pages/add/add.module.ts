import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Add } from './add';


@NgModule({
  declarations: [
    Add,
  ],
  imports: [
      IonicPageModule.forChild(Add),
  ],
  exports: [
    Add
  ]
})
export class AddModule {}
