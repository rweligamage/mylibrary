import { Component, ViewChild, } from '@angular/core';
import { IonicPage, NavController, } from 'ionic-angular';
import { Content, } from 'ionic-angular';

import { DataSvc } from '../../providers/data-svc';
/**
* Generated class for the Home page.
*
* See http://ionicframework.com/docs/components/#navigation for more info
* on Ionic pages and navigation.
*/
@IonicPage()
@Component({
    selector: 'page-sort',
    templateUrl: 'sort.html',
})
export class Sort {
    @ViewChild(Content) content: Content;

    items: Array<string> = ["Author", "Lent", "Title"]

    constructor(
        public navCtrl: NavController,
        public dataSvc: DataSvc,
    ) {
        console.log('Wish');
    }
    ionViewDidLoad() {

    }
    reorderItems(indexes) {
        console.log('indexes-->', indexes);
        let element = this.items[indexes.from];
        this.items.splice(indexes.from, 1);
        this.items.splice(indexes.to, 0, element);
        console.log(this.items);
    }

}