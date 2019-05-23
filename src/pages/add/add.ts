import { Component, ViewChild, NgZone, } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, Content, } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

import { Book } from '../../model/types';
import { DataSvc } from '../../providers/data-svc';
import { KeyboardSvc } from '../../providers/keyboard-svc';
import { DeviceSvc } from '../../providers/device-svc';

/**
 * Generated class for the Login page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
    selector: 'page-add',
    templateUrl: 'add.html',
})
export class Add {
    @ViewChild(Content) content: Content;

    isSearching: boolean;
    book: Book;
    mode: string;
    searchResultBook: Book;
    storedImagePath: string;
    from: string;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public dataSvc: DataSvc,
        public alertCtrl: AlertController,
        public barcodeScanner: BarcodeScanner,
        public ngZone: NgZone,
        public keyboardSvc: KeyboardSvc,
        public deviceSvc: DeviceSvc,
    ) {
        console.log('Add');
        this.clearBookData();
        let para = this.navParams.get('data') as Book;
        this.from = this.navParams.get('from');
        this.storedImagePath = this.dataSvc.getStoredImagePath();
        if (para) {
            this.mode = 'edit';
            this.book = Object.assign({}, para);
        } else {
            this.mode = 'add';
        }
    }
    ionViewDidEnter() {
        if (this.searchResultBook) {
            this.searchByBookId(this.searchResultBook.id);
        } else {
            this.isSearching = false;
        }
    }
    clearBookData() {
        this.book = {
            id: this.dataSvc.getGUID(),
            title: "",
            isbn: "",
            author: "",
            lent: "",
            coverImage: {
                type: "",
                filePath: ""
            },
            rating: "",
            pageCount: "",
            description: "",
            publisher: "",
            year: "",
            searchText: "",
            shelf: this.dataSvc.getLastSavedShelf()
        };
    }
    onClickImageAdd() {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                this.deviceSvc.captureImage().subscribe(
                    data => {
                        console.log('onClickAddPhoto success-->', data);
                        this.ngZone.run(() => {
                            this.book.coverImage = data;
                            this.content.resize();
                        });
                    },
                    err => {
                        console.log('onClickAddPhoto fail-->', err);
                    });
            });
    }
    onClickSearch() {
        this.isSearching = true;
        if (this.book.isbn) {
            this.searchByIsbn();
        } else {
            this.searchByTitle();
        }
    }
    searchByIsbn() {
        this.dataSvc.searchOnGoodReadsReviewByIsbn(this.book.isbn)
            .subscribe(
                data => {
                    this.populateBookData(data);
                },
                err => {
                    console.log('err-->', err);
                    if (this.book.title || this.book.author) {
                        this.searchByTitle();
                    } else {
                        this.isSearching = false;
                        if (err === 'no_network') {
                            this.showAlert('No network!', 'Check your internet connection please.');
                        } else {
                            this.showAlert('Unale to search by ISBN!', "Please enter the book title and retry.");
                        }
                    }
                }
            );
    }
    populateBookData(data) {
        this.book = data;
        this.isSearching = false;
    }
    searchByTitle() {
        this.dataSvc.searchOnGoodReadsByTitle(this.book.title + " " + this.book.author)
            .subscribe(
                data => {
                    console.log(data);
                    if (data.length === 0) {
                        this.searchByBookId(data[0].id);
                    } else {
                        this.searchResultBook = null;
                        this.navCtrl.push("Results", {
                            results: data,
                            callback: this.whenBookIsSelected.bind(this)
                        }).catch((e) => console.log('navigation error from new order to pickup---', e));
                    }
                },
                err => {
                    console.log('err-->', err);
                    this.isSearching = false;
                    if (err === 'no_network') {
                        this.showAlert('No network!', 'Check your internet connection please.');
                    } else {
                        this.showAlert('Unale to search by title!', "Please enter the book manually.");
                    }
                }
            );
    }
    whenBookIsSelected(selectedBook: Book) {
        return new Promise((resolve, reject) => {
            console.log('selectedBook--->', selectedBook);
            this.searchResultBook = selectedBook;
            resolve();
        });
    }
    searchByBookId(goodreadBookId: string) {
        this.dataSvc.searchOnGoodReadsByBookId(goodreadBookId)
            .subscribe(
                data => {
                    this.populateBookData(data);
                },
                err => {
                    console.log('err-->', err);
                    this.isSearching = false;
                    this.book = this.searchResultBook;
                    if (err === 'no_network') {
                        this.showAlert('No network!', 'Check your internet connection please.');
                    } else {
                        this.showAlert('Unale to search by title!', "Please enter the book manually.");
                    }
                }
            );
    }
    showAlert(title: string, msg: string) {
        let alert = this.alertCtrl.create({
            title: title,
            message: msg,
            buttons: ['OK']
        });
        alert.present().catch(() => { console.log('alert dismiss catch'); });
    }
    onClickAddBook() {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                if (this.mode === 'add') {
                    this.checkForDuplicate(this.book);
                } else {
                    this.editBook(this.book);
                }
            });
    }
    checkForDuplicate(book: Book) {
        let duplicateMsg = this.dataSvc.checkDuplicate(book);
        if (duplicateMsg) {
            let alert = this.alertCtrl.create({
                title: duplicateMsg,
                message: "Want to add this anyway?",
                buttons: [
                    {
                        text: 'Yes',
                        role: 'cancel',
                        handler: () => {
                            this.addBook(book);
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
        } else {
            this.addBook(book);
        }
    }
    addBook(book: Book) {
        this.dataSvc.addBook(book, this.from)
            .subscribe(
                () => {
                    this.showAlert('Successfully added!', book.title + " by " + book.author + ".");
                    this.clearBookData();
                }
            );
    }
    editBook(book: Book) {
        this.dataSvc.editBook(book, this.from)
            .subscribe(
                () => {
                    this.navCtrl.pop().catch(() => console.log('from song to add'));
                }
            );
    }
    onClickDelete() {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                var alert = this.alertCtrl.create({
                    title: 'Confirmation',
                    message: "Are you sure you want to delete this book?",
                    buttons: [
                        {
                            text: 'Yes',
                            role: 'cancel',
                            handler: () => {
                                this.dataSvc.deleteBook(this.book.id, this.from)
                                    .subscribe(
                                        () => {
                                            this.navCtrl.pop().catch(() => console.log('from song to add'));
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
    onClickScan() {
        this.keyboardSvc.afterKeyboardHidden()
            .subscribe(() => {
                this.barcodeScanner.scan({ formats: "EAN_13,EAN_8", })
                    .then(barcodeData => {
                        console.log('Barcode data', JSON.stringify(barcodeData));
                        this.book.isbn = barcodeData.text;
                    }).catch(err => {
                        console.log('Error', err);
                    });
            });
    }
    onClickDeleteChip(chip: Element) {
        chip.remove();
    }
}
