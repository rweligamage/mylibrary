import { NgModule,  } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Sort } from './sort';

@NgModule({
    declarations: [
        Sort,
    ],
    imports: [
        IonicPageModule.forChild(Sort),
    ],
    exports: [
        Sort
    ],
})
export class WishModule { }
