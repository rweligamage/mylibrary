import { Component, } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController, } from 'ionic-angular';

import { DataSvc } from '../../providers/data-svc';
import { BookResults, Book, } from '../../model/types';

/**
 * Generated class for the Login page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
    selector: 'page-sync',
    templateUrl: 'sync.html',
})
export class Sync {
    
    iabRef: any;
    importingList: BookResults[];
    backdropLoader: any;

    constructor(
        public navCtrl: NavController,
        public navParam: NavParams,
        public dataSvc: DataSvc,
        public alertCtrl: AlertController,
        public loadingCtrl: LoadingController,
    ) {
        this.importingList = this.navParam.get('data');
    }
    importBooksNow() {
        let addToBooks: Array<Book> = [];
        let addToWish: Array<Book> = [];
        this.importingList.forEach(bkObj => {
            if (bkObj.shouldImport) {
                if (bkObj.listType === 'booklist') {
                    addToBooks.push(bkObj.book);
                } else {
                    addToWish.push(bkObj.book);
                }
            }
        });
        if (addToBooks.length > 0 || addToWish.length > 0) {
            this.showBackDropLoader();
            this.dataSvc.importSelectedBooks(addToBooks, addToWish)
                .subscribe(
                    () => {
                        this.backdropLoader.dismiss().catch(() => console.log('from song to add'));
                        let alert = this.alertCtrl.create({
                            title: (addToBooks.length + addToWish.length) + " books",
                            message: 'Import successfully.',
                            buttons: [
                                {
                                    text: 'OK',
                                    handler: () => {
                                        this.navCtrl.pop().catch(() => console.log('from song to add'));
                                        return true;
                                    }
                                }
                            ]
                        });
                        alert.present().catch(() => { console.log('alert dismiss catch'); });
                    }
                );
        }
    }
    showBackDropLoader() {
        this.backdropLoader = this.loadingCtrl.create({
            content: 'Please wait...',
            spinner: 'crescent',
            cssClass: 'my_backdrop_loader',
            showBackdrop: true,
        });
        this.backdropLoader.present().catch(() => console.log('from song to add'));
    }
}


