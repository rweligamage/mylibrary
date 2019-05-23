import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Import } from './import';


@NgModule({
  declarations: [
    Import,
  ],
  imports: [
      IonicPageModule.forChild(Import),
  ],
  exports: [
    Import
  ]
})
export class ImportModule {}
