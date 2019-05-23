import { Component, ViewChild, } from '@angular/core';
import { IonicPage, NavController, List, AlertController, } from 'ionic-angular';
import { Platform, Content, } from 'ionic-angular';

import { DataSvc } from '../../providers/data-svc';
import { Book } from '../../model/types';
import { KeyboardSvc } from '../../providers/keyboard-svc';
/**
* Generated class for the Home page.
*
* See http://ionicframework.com/docs/components/#navigation for more info
* on Ionic pages and navigation.
*/
@IonicPage()
@Component({
    selector: 'page-home',
    templateUrl: 'home.html',
})
export class Home {
    @ViewChild(Content) content: Content;
    @ViewChild(List) list: List;

    status: string;
    serverBooks: Array<Book>;
    filteredBooks: Array<Book> = [];
    renderedBooks: Array<Book> = [];
    searchText: string;
    infiniScrollRef: any;
    paginationLength: number = 75;
    storedImagePath: string


    constructor(
        public navCtrl: NavController,
        public platform: Platform,
        public dataSvc: DataSvc,
        public keyboardSvc: KeyboardSvc,
        public alertCtrl: AlertController,
    ) {
        console.log('HOME');
        this.status = 'initializing';
        this.searchText = "";
        this.platform.ready().then(() => {
            console.log('platform ready');
            this.storedImagePath = this.dataSvc.getStoredImagePath();
            this.dataSvc.initCacheData().subscribe(
                data => {
                    console.log('data-->', data);
                    setTimeout(() => {
                        this.serverBooks = data;
                        this.status = "initialized";
                        this.onChangeSearchText();
                    });
                },
                err => {
                    console.log('err-->', err);
                    this.status = "initialized";
                });
        });
    }
    ionViewWillEnter() {
        console.log("ionViewWillEnter->", this.status);
        if (this.status === 'initialized') {
            this.serverBooks = this.dataSvc.getMyBookList();
            this.onChangeSearchText();
        }
    }
    trackByVal(index, book: Book) {
        return book.id;
    }
    onClickAddBook() {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                this.navCtrl.push("Add", { from: 'home'}).catch(() => console.log('from song to add'));
            });
    }
    onChangeSearchText() {
        let val = this.searchText;
        if (val) {
            val = val.toLowerCase();
            this.filteredBooks = this.serverBooks.filter(({ searchText }) => {
                console.log(searchText, '--->', val);
                return (searchText.indexOf(val) > -1);
            })
            this.initPagination(this.filteredBooks);
        } else {
            this.initPagination(this.serverBooks);
        }
    }
    initPagination(tgtList): void {
        if (tgtList.length > this.paginationLength) {
            this.renderedBooks = tgtList.slice(0, this.paginationLength);
        } else {
            this.renderedBooks = tgtList;
        }
        if (this.infiniScrollRef) {
            this.infiniScrollRef.enable(true);
        }
        this.content.resize();
        console.log(this.renderedBooks);
    }
    onClickBook(book: Book) {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                this.navCtrl.push("Add", { data: book, from: 'home'}).catch(() => console.log('from song to add'));
            });
    }
    onClickReturned(book: Book) {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                book.lent = "";
                this.dataSvc.editBook(book, 'home')
                    .subscribe(
                        () => {
                            setTimeout(() => {
                                try {
                                    if (this.list && this.list.closeSlidingItems) {
                                        this.list.closeSlidingItems();
                                    }
                                } catch (e) { }
                            }, 100);
                        }
                    );
            });
    }
    onClickDelete(book: Book) {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                let alert = this.alertCtrl.create({
                    title: 'Confirmation',
                    message: "Are you sure you want to delete this book?",
                    buttons: [
                        {
                            text: 'Yes',
                            role: 'cancel',
                            handler: () => {
                                this.dataSvc.deleteBook(book.id, 'home')
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
            });
    }
    //------------infinite scroll-----------
    loadMoreBooks(infiniteScroll) {
        console.log('loadMoreArtists----');
        this.infiniScrollRef = infiniteScroll;
        setTimeout(() => {
            let srcList = null;
            if (this.searchText) {
                srcList = this.filteredBooks;
            } else {
                srcList = this.serverBooks;
            }
            let srcListLength = srcList.length;
            let renderedListLength = this.renderedBooks.length;
            console.log(renderedListLength, ' , Begin async operation-->', srcListLength);
            if (renderedListLength < srcListLength) {
                setTimeout(() => {
                    if (renderedListLength + this.paginationLength <= srcListLength) {
                        this.renderedBooks = srcList.slice(0, renderedListLength + this.paginationLength);
                    } else {
                        this.renderedBooks = srcList.slice();
                    }
                    console.log('Async operation has ended-->', this.renderedBooks.length);
                    if (this.infiniScrollRef) {
                        this.infiniScrollRef.complete();
                    }
                    this.content.resize();
                }, 500);
            } else {
                console.log('theres no more artists to load');
                if (this.infiniScrollRef) {
                    this.infiniScrollRef.enable(false);
                }
            }
        });
    }
}

// onDragBook(event, book: Book) {
//     if (!book.lent) {
//         event.close();
//     }
// }
