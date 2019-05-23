import { Component, ViewChild, } from '@angular/core';
import { IonicPage, NavController, List, AlertController, } from 'ionic-angular';
import { Content, } from 'ionic-angular';

import { DataSvc } from '../../providers/data-svc';
import { Book } from '../../model/types';
/**
* Generated class for the Home page.
*
* See http://ionicframework.com/docs/components/#navigation for more info
* on Ionic pages and navigation.
*/
@IonicPage()
@Component({
    selector: 'page-wish',
    templateUrl: 'wish.html',
})
export class Wish {
    @ViewChild(Content) content: Content;
    @ViewChild(List) list: List;

    wishBooks: Array<Book>;
    storedImagePath: string

    constructor(
        public navCtrl: NavController,
        public dataSvc: DataSvc,
        public alertCtrl: AlertController,
    ) {
        console.log('Wish');
    }
    ionViewDidLoad(){
        this.storedImagePath = this.dataSvc.getStoredImagePath();
    }
    ionViewWillEnter() {
        this.wishBooks = this.dataSvc.getWishBookList();
        this.content.resize();
        console.log("ionViewWillEnter->", this.wishBooks);
    }
    trackByVal(index, book: Book) {
        return book.id;
    }
    onClickAddBook() {
        this.navCtrl.push("Add", { from: 'wish' }).catch(() => console.log('from song to add'));
    }
    onClickBook(book: Book) {
        this.navCtrl.push("Add", { from: 'wish', data: book }).catch(() => console.log('from song to add'));
    }
    onClickPurchased(book: Book) {
        this.dataSvc.deleteBook(book.id, 'wish')
            .subscribe(
                () => {
                    this.dataSvc.addBook(book, 'home')
                        .subscribe(
                            () => {
                                this.ionViewWillEnter();
                            }
                        );
                }
            );
    }
    onClickDelete(book: Book) {
        let alert = this.alertCtrl.create({
            title: 'Confirmation',
            message: "Are you sure you want to delete this book?",
            buttons: [
                {
                    text: 'Yes',
                    role: 'cancel',
                    handler: () => {
                        this.dataSvc.deleteBook(book.id, 'wish')
                            .subscribe(
                                () => {
                                    this.ionViewWillEnter();
                                }
                            );
                        return true;
                    }
                },
                {
                    text: 'No',
                    handler: () => {
                        return true;
                    }
                }
            ]
        });
        alert.present().catch(() => { console.log('alert dismiss catch'); });
    }
}