import { NgModule,  } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Wish } from './wish';

@NgModule({
    declarations: [
        Wish,
    ],
    imports: [
        IonicPageModule.forChild(Wish),
    ],
    exports: [
        Wish
    ],
})
export class WishModule { }
