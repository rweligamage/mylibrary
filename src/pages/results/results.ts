import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { Book } from '../../model/types';
import { DataSvc } from '../../providers/data-svc';
/**
 * Generated class for the PickupInstructions page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
    selector: 'page-results',
    templateUrl: 'results.html',
})
export class Results {
    results: Array<Book>;
    parentCallback: any;
    storedImagePath: string

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public dataSvc: DataSvc,
    ) {
        console.log('PICKUP INSTRUCTIONS');
        this.storedImagePath = this.dataSvc.getStoredImagePath();
        this.results = this.navParams.get('results');
    }
    //its important to keep the parentcallback assignment after changing pickupInstructions on constructor, otherwise it will trigger onchange
    ionViewDidEnter() {
        this.parentCallback = this.navParams.get('callback');
    }
    onClickBook(book: Book) {
        if (this.parentCallback) {
            this.parentCallback(book).then(() => {
                this.navCtrl.pop().catch((e) => console.log('navigation error from pick to new order---', e));;
            }).catch((e) => console.log('parent callback calling error'));
        }
    }
}