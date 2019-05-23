import { Injectable } from '@angular/core';
import { Http, Response, ResponseContentType, } from '@angular/http';
import { Platform, } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import xml2js from 'xml2js';
import { File, } from '@ionic-native/file';
import { EmailComposer } from '@ionic-native/email-composer';
import { FileChooser } from '@ionic-native/file-chooser';


import { CONFIG } from './config';

import { Book, GoodreadResultsByIsbn, GoodreadResultsByTitle, GoodreadBookByTitle, BookResults, } from '../model/types';

import sampleJsonFile from '../assets/data/export_books';

/*
  Generated class for the DatasvcProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class DataSvc {

    mybooks: Book[];
    wishbooks: Book[];
    getIsbnFromJson: boolean = false;
    getTitleFromJson: boolean = false;
    getReviewFromId: boolean = false;
    dataDirectoryPath: string;
    lastShelf: string = "";

    constructor(
        public httpDefault: Http,
        public storage: Storage,
        public http: HTTP,
        public network: Network,
        public file: File,
        public platform: Platform,
        public emailComposer: EmailComposer,
        public fileChooser: FileChooser,
    ) {
        console.log('DATASVC');
    }
    getLastSavedShelf(): string {
        return this.lastShelf;
    }
    getMyBookList(): Book[] {
        return this.mybooks;
    }
    getWishBookList(): Book[] {
        return this.wishbooks;
    }
    getStoredImagePath(): string {
        if (!this.dataDirectoryPath) {
            this.dataDirectoryPath = this.platform.is("cordova") ? this.file.dataDirectory.substr("file://".length) : "";
        }
        return this.dataDirectoryPath;
    }
    ////////////////////////////////////
    initCacheData(): Observable<Book[]> {
        return Observable.create(observer => {
            this.storage.get('lastShelf').then((lastShelf) => {
                this.lastShelf = lastShelf;
                this.storage.get('wishbooks').then((wishbooks) => {
                    console.log('wishbooks storage--->', wishbooks);
                    if (wishbooks && wishbooks.length > 0) {
                        this.wishbooks = wishbooks;
                    } else {
                        this.wishbooks = [];
                    }
                    this.storage.get('mybooks').then((books) => {
                        console.log('mybooks storage--->', books);
                        if (books && books.length > 0) {
                            this.mybooks = books;
                            observer.next(books);
                            observer.complete();
                        } else {
                            this.mybooks = [];
                            observer.error();
                        }
                    });
                });
            });
        });
    }
    searchOnGoodReadsReviewByIsbn(isbn: string): Observable<Book> {
        return Observable.create(observer => {
            if (this.getIsbnFromJson) {
                this.httpDefault.get('../assets/data/howto.xml', { responseType: ResponseContentType.Text })
                    .subscribe(
                        (data: Response) => {
                            if (data && typeof data.text === 'function') { //if ResponseType is json we have to call .json()
                                this.onSuccessByBookResult(observer, data.text());
                            } else {
                                this.onFailedCallback(observer, 'empty_books');
                            }
                        },
                        (err) => {
                            console.log('>>', err);
                            this.onFailedCallback(observer, err.statusText);
                        }
                    );

            } else {
                this.http.get(
                    CONFIG.GOODREADS_URL_BY_ISBN + isbn,
                    {
                        key: CONFIG.GOODREADS_KEY
                    },
                    {
                        AccessControlAllowOrigin: '*',
                        "Access-Control-Allow-Origin": "*"
                    }
                ).then((data) => {
                    console.log('data--->' + JSON.stringify(data));
                    if (data && data.data) {
                        this.onSuccessByBookResult(observer, data.data);
                    } else {
                        this.onFailedCallback(observer, 'empty_books');
                    }
                }).catch((err) => {
                    console.log(this.network.type, '--goodread err--->', err);
                    this.onFailedCallback(observer, (!this.network.type || this.network.type === "none" ? 'no_network' : err.error));
                });
            }
        });
    }
    onSuccessByBookResult(observer, data) {
        if (data) {
            let parser = new xml2js.Parser({
                trim: true,
                explicitArray: true,
            });
            parser.parseString(data, (err, results) => {
                if (err) {
                    observer.error('xml_parse_err');
                } else {
                    console.log(results);
                    let resultBook: Book;
                    let response = results as GoodreadResultsByIsbn;
                    if (response && response.GoodreadsResponse && response.GoodreadsResponse.book && response.GoodreadsResponse.book.length > 0) {
                        let searchResult = response.GoodreadsResponse.book[0];
                        let img = "";
                        if (searchResult.image_url && searchResult.image_url[0] && searchResult.image_url[0].trim().length > 0) {
                            img = searchResult.image_url[0].trim();
                        } else if (searchResult.small_image_url && searchResult.small_image_url[0] && searchResult.small_image_url[0].trim().length > 0) {
                            img = searchResult.small_image_url[0].trim();
                        }
                        let author = "";
                        if (searchResult.authors && searchResult.authors[0] && searchResult.authors[0].author && searchResult.authors[0].author.length > 0) {
                            searchResult.authors[0].author.reverse().forEach(auth => {
                                if (auth && auth.name && auth.name[0] && auth.name[0].trim().length > 0) {
                                    author += ", " + auth.name[0].trim();
                                }
                            });
                            if (author.length > 0) {
                                author = author.substr(2);

                            }
                        }
                        let isbn = "";
                        if (searchResult.isbn13 && searchResult.isbn13[0] && searchResult.isbn13[0].trim().length > 0) {
                            isbn = searchResult.isbn13[0].trim();
                        } else if (searchResult.isbn && searchResult.isbn[0] && searchResult.isbn[0].trim().length > 0) {
                            isbn = searchResult.isbn[0].trim();
                        }
                        resultBook = {
                            id: this.getGUID(),
                            title: (searchResult.title && searchResult.title[0]) ? searchResult.title[0].trim() : "",
                            year: (searchResult.publication_year && searchResult.publication_year[0]) ? searchResult.publication_year[0].trim() : "",
                            publisher: (searchResult.publisher && searchResult.publisher[0]) ? searchResult.publisher[0].trim() : "",
                            description: (searchResult.description && searchResult.description[0]) ? searchResult.description[0].trim() : "",
                            pageCount: (searchResult.num_pages && searchResult.num_pages[0]) ? searchResult.num_pages[0].trim() : "",
                            rating: (searchResult.average_rating && searchResult.average_rating[0]) ? searchResult.average_rating[0].trim() : "",
                            coverImage: { type: img ? 'web' : "", filePath: img },
                            author: author,
                            isbn: isbn,
                            shelf: this.lastShelf,
                        };
                        this.buildSearchText(resultBook);
                    }
                    console.log('resultBook --> ', resultBook);
                    if (resultBook) {
                        observer.next(resultBook);
                        observer.complete();
                    } else {
                        this.onFailedCallback(observer, 'empty_books');
                    }
                }
            });
        } else {
            this.onFailedCallback(observer, 'empty_books');
        }
    }
    buildSearchText(resultBook: Book) {
        resultBook.searchText = "";
        [resultBook.title, resultBook.isbn, resultBook.author].forEach(val => {
            if (val) {
                resultBook.searchText += "," + val.toLocaleLowerCase();
            }
        });
        resultBook.searchText = resultBook.searchText.substr(1);
    }
    onFailedCallback(observer, err) {
        observer.error(err || "error_occured");
    }
    //---------------------------------------
    searchOnGoodReadsByTitle(searchQuery: string): Observable<Book[]> {
        return Observable.create(observer => {
            if (this.getTitleFromJson) {
                this.httpDefault.get('../assets/data/yachakaya.xml', { responseType: ResponseContentType.Text })
                    .subscribe(
                        (data: Response) => {
                            if (data && typeof data.text === 'function') { //if ResponseType is json we have to call .json()
                                this.onSuccessBySearchResult(observer, data.text());
                            } else {
                                this.onFailedCallback(observer, 'empty_books');
                            }
                        },
                        (err) => {
                            console.log('>>', err);
                            this.onFailedCallback(observer, err.statusText);
                        }
                    );

            } else {
                this.http.get(
                    CONFIG.GOODREADS_URL_BY_TITLE,
                    {
                        key: CONFIG.GOODREADS_KEY,
                        q: searchQuery.replace(/ /g, "+")
                    },
                    {
                        AccessControlAllowOrigin: '*',
                        "Access-Control-Allow-Origin": "*"
                    }
                ).then((data) => {
                    console.log('data--->' + JSON.stringify(data));
                    if (data && data.data) {
                        this.onSuccessBySearchResult(observer, data.data);
                    } else {
                        observer.error('empty_books');
                    }
                }).catch((err) => {
                    console.log(this.network.type, '--goodread err--->', err);
                    this.onFailedCallback(observer, (!this.network.type || this.network.type === "none" ? 'no_network' : err.error));
                });
            }
        });
    }
    onSuccessBySearchResult(observer, data) {
        if (data) {
            let parser = new xml2js.Parser({
                trim: true,
                explicitArray: true,
            });
            parser.parseString(data, (err, results) => {
                if (err) {
                    observer.error('xml_parse_err');
                } else {
                    let resultBooks: Book[] = [];
                    let response = results as GoodreadResultsByTitle;
                    console.log(response);
                    if (response && response.GoodreadsResponse && response.GoodreadsResponse.search && response.GoodreadsResponse.search[0] && response.GoodreadsResponse.search[0].results && response.GoodreadsResponse.search[0].results[0] && response.GoodreadsResponse.search[0].results[0].work && response.GoodreadsResponse.search[0].results[0].work.length > 0) {
                        let workArray = response.GoodreadsResponse.search[0].results[0].work;
                        workArray.forEach(workResult => {
                            if (workResult.best_book && workResult.best_book[0]) {
                                resultBooks.push(this.getBookFromWorkResult(workResult.best_book[0]));
                            }
                        });
                        console.log('resultBook --> ', resultBooks);
                        if (resultBooks && resultBooks.length > 0) {
                            observer.next(resultBooks);
                            observer.complete();
                        } else {
                            this.onFailedCallback(observer, 'empty_books');
                        }
                    } else {
                        this.onFailedCallback(observer, 'empty_books');
                    }
                }
            });
        } else {
            this.onFailedCallback(observer, 'empty_books');
        }
    }
    getBookFromWorkResult(bestbook: GoodreadBookByTitle): Book {
        let bookId = "";
        if (bestbook.id && bestbook.id[0] && bestbook.id[0]._ && bestbook.id[0]._.trim().length > 0) {
            bookId = bestbook.id[0]._.trim();
        }
        let author = "";
        if (bestbook.author && bestbook.author[0] && bestbook.author[0].name && bestbook.author[0].name[0] && bestbook.author[0].name[0].trim().length > 0) {
            author = bestbook.author[0].name[0].trim();
        }
        let coverImage = "";
        if (bestbook.image_url && bestbook.image_url[0] && bestbook.image_url[0].trim().length > 0) {
            coverImage = bestbook.image_url[0].trim();
        } else if (bestbook.small_image_url && bestbook.small_image_url[0] && bestbook.small_image_url[0].trim().length > 0) {
            coverImage = bestbook.small_image_url[0].trim();
        }
        return {
            title: bestbook.title && bestbook.title[0] ? bestbook.title[0].trim() : "",
            id: bookId,
            author: author,
            coverImage: { type: coverImage ? 'web' : "", filePath: coverImage }
        };
    }
    //-----------------------------
    searchOnGoodReadsByBookId(goodreadId): Observable<Book> {
        return Observable.create(observer => {
            if (this.getReviewFromId) {
                this.httpDefault.get('../assets/data/monte_2.xml', { responseType: ResponseContentType.Text })
                    .subscribe(
                        (data: Response) => {
                            if (data && typeof data.text === 'function') { //if ResponseType is json we have to call .json()
                                this.onSuccessByBookResult(observer, data.text());
                            } else {
                                this.onFailedCallback(observer, 'empty_books');
                            }
                        },
                        (err) => {
                            console.log('>>', err);
                            this.onFailedCallback(observer, err.statusText);
                        }
                    );

            } else {
                this.http.get(
                    CONFIG.GOODREADS_URL_BY_ISBN + goodreadId + ".xml",
                    {
                        key: CONFIG.GOODREADS_KEY
                    },
                    {
                        AccessControlAllowOrigin: '*',
                        "Access-Control-Allow-Origin": "*"
                    }
                ).then((data) => {
                    console.log('data--->' + JSON.stringify(data));
                    if (data && data.data) {
                        this.onSuccessByBookResult(observer, data.data);
                    } else {
                        this.onFailedCallback(observer, 'empty_books');
                    }
                }).catch((err) => {
                    console.log(this.network.type, '--goodread err--->', err);
                    this.onFailedCallback(observer, (!this.network.type || this.network.type === "none" ? 'no_network' : err.error));
                });
            }
        });
    }
    getGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    sortBooksAndSave(array: Array<Book>) {
        array.sort((a, b) => {
            let txtA = "";
            let txtB = "";

            if (a.lent){
                txtA = "0" + a.lent;
            }else if (a.shelf){
                txtA = "1" + a.shelf;
            }else if (a.author){
                txtA = "2" + a.author;
            }else {
                txtA = "3" + a.title;
            }

            

            if (b.lent){
                txtB = "0" + b.lent;
            }else if (b.shelf){
                txtB = "1" + b.shelf;
            }else if (b.author){
                txtB = "2" + b.author;
            }else {
                txtB = "3" + b.title;
            }
            txtA = txtA.trim().toUpperCase();
            txtB = txtB.trim().toUpperCase();
            if (txtA < txtB) {
                return -1;
            }
            if (txtA > txtB) {
                return 1;
            }
            return 0;
        });
    }
    //-------------------------------
    addBook(book: Book, from: string): Observable<string> {
        return Observable.create(observer => {
            if (!book.searchText) {
                this.buildSearchText(book);
            }
            book.searchText = book.searchText.toLocaleLowerCase();
            this[from === 'home' ? 'mybooks' : 'wishbooks'].push(book);
            this.sortBooksAndSave(this[from === 'home' ? 'mybooks' : 'wishbooks']);
            this.storage.set((from === 'home' ? 'mybooks' : 'wishbooks'), this[from === 'home' ? 'mybooks' : 'wishbooks'])
                .then(() => {
                    this.saveLastShelf(observer, book);
                });
        });
    }
    saveLastShelf(observer, book: Book,){
        if ( book.shelf && book.shelf.trim().length > 0){
            this.storage.set('lastShelf', book.shelf.trim()).then(() => {
                this.lastShelf = book.shelf.trim();
                observer.next();
                observer.complete();
            });
        }else{
            observer.next();
            observer.complete();
        }
    }
    checkDuplicate(add: Book): string {
        let checkResults = {
            byIsbnOnMy: null,
            byTitleOnMy: 0,
            byIsbnOnWish: null,
            byTitleOnWish: 0,
            msg: "",
        };
        this.mybooks.forEach(bk => {
            if (bk.isbn && add.isbn && bk.isbn === add.isbn) {
                checkResults.byIsbnOnMy = bk;
            } else if (bk.title && add.title && bk.title.toLocaleLowerCase() === add.title.toLocaleLowerCase().trim()) {
                checkResults.byTitleOnMy++;
            }
        });
        this.wishbooks.forEach(bk => {
            if (bk.isbn && add.isbn && bk.isbn === add.isbn) {
                checkResults.byIsbnOnWish = bk;
            } else if (bk.title && add.title && bk.title.toLocaleLowerCase() === add.title.toLocaleLowerCase().trim()) {
                checkResults.byTitleOnWish++;
            }
        });
        if (checkResults.byIsbnOnMy || checkResults.byIsbnOnWish || checkResults.byTitleOnMy > 0 || checkResults.byTitleOnWish > 0) {
            if (checkResults.byIsbnOnMy) {
                checkResults.msg = "Book with the same ISBN already exists on 'BOOK' list."
            }
            if (checkResults.byIsbnOnWish) {
                if (checkResults.msg) {
                    checkResults.msg = "Book with the same ISBN already exists on both 'BOOK & WISH' lists."
                } else {
                    checkResults.msg = "Book with the same ISBN already exists on 'WISH' list."
                }
            }
            if (checkResults.byTitleOnMy > 0) {
                if (checkResults.msg) {
                    checkResults.msg = checkResults.msg + " Another " + (checkResults.byTitleOnMy === 1 ? 'book' : checkResults.byTitleOnMy + ' books') + " with the same title exists on 'BOOKS' list."
                } else {
                    checkResults.msg = (checkResults.byTitleOnMy === 1 ? 'A book' : checkResults.byTitleOnMy + ' books') + " with the same title exists on 'BOOKS' list."
                }
            }
            if (checkResults.byTitleOnWish > 0) {
                if (checkResults.msg) {
                    checkResults.msg = checkResults.msg + " Another " + (checkResults.byTitleOnWish === 1 ? 'book' : checkResults.byTitleOnWish + ' books') + " with the same title exists on 'WISH' list."
                } else {
                    checkResults.msg = (checkResults.byTitleOnWish === 1 ? 'A book' : checkResults.byTitleOnWish + ' books') + " with the same title exists on 'WISH' list."
                }
            }
        }
        return checkResults.msg;
    }
    editBook(book: Book, from: string): Observable<string> {
        return Observable.create(observer => {
            let arry = this[from === 'home' ? 'mybooks' : 'wishbooks'];
            for (let i = 0; i < arry.length; i++) {
                if (arry[i].id === book.id) {
                    if (!book.searchText) {
                        this.buildSearchText(book);
                    }
                    book.searchText = book.searchText.toLocaleLowerCase();
                    arry[i] = book;
                    break;
                }
            }
            this[from === 'home' ? 'mybooks' : 'wishbooks'] = arry;
            this.sortBooksAndSave(this[from === 'home' ? 'mybooks' : 'wishbooks']);
            this.storage.set((from === 'home' ? 'mybooks' : 'wishbooks'), this[from === 'home' ? 'mybooks' : 'wishbooks'])
                .then(() => {
                    this.saveLastShelf(observer, book);
                });
        });
    }
    deleteBook(id: string, from: string): Observable<string> {
        return Observable.create(observer => {
            let arr = this[from === 'home' ? 'mybooks' : 'wishbooks'];
            console.log('b4 delete ---> ', arr.length);
            let filtered = arr.filter(book => {
                return book.id !== id;
            });
            this[from === 'home' ? 'mybooks' : 'wishbooks'] = filtered;
            this.storage.set((from === 'home' ? 'mybooks' : 'wishbooks'), this[from === 'home' ? 'mybooks' : 'wishbooks'])
                .then(() => {
                    observer.next();
                    observer.complete();
                });
        });
    }
    //------------------------------------
    importBooksFromJson(): Observable<BookResults[]> {
        return Observable.create(observer => {
            if (this.platform.is('cordova')) {
                if (this.platform.is('ios')) {
                    if (window["DocumentPicker"] && window["DocumentPicker"].getFile && typeof window["DocumentPicker"].getFile === 'function') {
                        window["DocumentPicker"].getFile(
                            'all',
                            (uri) => {
                                this.checkFileFormat(observer, uri);
                            },
                            (err) => {
                                console.log('Error', err);
                                observer.error("file_picker_error")
                            }
                        );
                    } else {
                        console.log('******** ios document picker plugin not found');
                        observer.error("file_picker_error")
                    }

                } else {
                    this.fileChooser.open()
                        .then(uri => {
                            console.log('file chooser success-->', uri);
                            this.checkFileFormat(observer, uri);
                        })
                        .catch(err => {
                            console.log('file chooser error-->', JSON.stringify(err));
                            observer.error("file_picker_error")
                        });
                }
            } else {
                console.log('**************** sample json file **************');
                this.validateImport(observer, sampleJsonFile);
            }
        });
    }
    checkFileFormat(observer, filePath: string) {
        console.log(filePath);
        // /private/var/mobile/Containers/Data/Application/2FC02277-EE0F-44E6-AFD5-7F0C2BD31D0B/tmp/lk.rcw.library-Inbox/Rohan_CV_BRIEF.doc
        //if it's es-file-browser, it will be success: content://com.estrongs.files/storage/emulated/0/Download/export_books.json
        // if it's not es-file-browser --> content://com.android.providers.downloads.documents/document/2028
        let lastSlashIndex = filePath.lastIndexOf("/");
        // let pathToOrgFile = filePath.substring(0, lastSlashIndex + 1);
        let orgFileName = filePath.substr(lastSlashIndex + 1);
        let lastDotIndex = orgFileName.lastIndexOf(".");
        console.log('lastDotIndex->', lastDotIndex);
        if (lastDotIndex > 0) {
            let extention = orgFileName.substr(lastDotIndex + 1);
            console.log('extention->', extention);
            if (extention === 'json') {
                this.getFileContent(observer, filePath);
            } else {
                observer.error("invalid_file")
            }
        } else {
            this.getFileContent(observer, filePath);
        }
    }
    getFileContent(observer, filePath) {
        this.httpDefault.get(filePath, { responseType: ResponseContentType.Json })
            .subscribe(
                (data: Response) => {
                    console.log('json file read success--->', JSON.stringify(data));
                    if (data && typeof data.json === 'function') {
                        this.validateImport(observer, data.json());
                    } else {
                        observer.error("invalid_file")
                    }
                },
                (err) => {
                    console.log('json file read error--->', JSON.stringify(err));
                    observer.error("invalid_file")
                }
            );
    }
    validateImport(observer, jsonData) {
        console.log('jsonData-->', jsonData);
        if (jsonData && jsonData instanceof Array && jsonData.length > 0) {
            let validatedList: BookResults[] = [];
            jsonData.forEach(obj => {
                if (obj && obj.title) {
                    let book: Book = {
                        title: (obj.title + "").trim(),
                        id: this.getGUID(),
                        searchText: "",
                        coverImage: {
                            type: "",
                            filePath: ""
                        }
                    }
                    let fieldList = ["author", "isbn", "publisher", "year", "rating", "pageCount", "description"];
                    fieldList.forEach(field => {
                        if (obj[field]) {
                            book[field] = (obj[field] + "").trim();
                        }
                    });
                    if (obj.coverImage && obj.coverImage.type && obj.coverImage.filePath && obj.coverImage.type === 'web') {
                        book.coverImage.type = obj.coverImage.type;
                        book.coverImage.filePath = obj.coverImage.filePath;
                    }
                    this.buildSearchText(book);
                    let dupMsg = this.checkDuplicate(book);
                    validatedList.push({
                        book: book,
                        shouldImport: dupMsg ? false : true,
                        listType: 'booklist',
                        duplicateMsg: dupMsg,
                    });
                }
            });
            // console.log('validatedList-->', validatedList);
            if (validatedList.length > 0) {
                observer.next(validatedList);
                observer.complete();
            } else {
                observer.error("invalid_json")
            }
        } else {
            observer.error("invalid_json")
        }
    }
    importSelectedBooks(toMyBooks: Book[], toWishList: Book[]): Observable<string> {
        return Observable.create(observer => {
            if (toMyBooks.length > 0) {
                this.concatToMyBooks(toMyBooks)
                    .subscribe(
                        () => {
                            this.checkWishListConcat(observer, toWishList);
                        }
                    );
            } else {
                this.checkWishListConcat(observer, toWishList);
            }
        });
    }
    checkWishListConcat(observer, toWishList: Book[]) {
        if (toWishList.length > 0) {
            this.wishbooks = this.wishbooks.concat(toWishList);
            this.sortBooksAndSave(this.wishbooks);
            this.storage.set("wishbooks", this.wishbooks)
                .then(() => {
                    observer.next();
                    observer.complete();
                });
        } else {
            observer.next('done');
            observer.complete();
        }
    }
    concatToMyBooks(extraBooks: Book[]): Observable<string> {
        return Observable.create(observer => {
            this.mybooks = this.mybooks.concat(extraBooks);
            this.sortBooksAndSave(this.mybooks);
            this.storage.set('mybooks', this.mybooks)
                .then(() => {
                    observer.next();
                    observer.complete();
                });
        });
    }
    //--------------------------------------
    exportBooksList(listType: string): Observable<string> {
        return Observable.create(observer => {
            if (this[listType].length > 0) {
                let sendingList: Array<Book> = [];
                let attachmentArray: Array<string> = [];
                let newFileName = "export_books.json";
                let observableArray = [];
                this[listType].forEach(bk => {
                    let newBkObj: Book = Object.assign({}, bk);
                    newBkObj.lent = "";
                    if (newBkObj.coverImage && newBkObj.coverImage.type && newBkObj.coverImage.filePath && newBkObj.coverImage.type === 'local') {
                        if (this.platform.is('ios')) {
                            attachmentArray.push(this.file.dataDirectory + newBkObj.coverImage.filePath);
                        } else {
                            observableArray.push(this.movedToExternalTemp(newBkObj.coverImage.filePath, attachmentArray));
                        }
                    }
                    sendingList.push(newBkObj);
                });
                this.file.writeFile(
                    this.file[this.platform.is('ios') ? "cacheDirectory" : "externalCacheDirectory"],
                    newFileName,
                    JSON.stringify(sendingList),
                    { replace: true }
                ).then((fileEntry) => {
                    console.log('file write-->', JSON.stringify(fileEntry));
                    attachmentArray.push(this.file[this.platform.is('ios') ? "cacheDirectory" : "externalCacheDirectory"] + newFileName);
                    if (observableArray.length > 0) {
                        console.log('**********waiting for q all------------------');
                        Observable.forkJoin(observableArray)
                            .subscribe(
                                () => {
                                    this.mailAttachment(observer, attachmentArray);
                                }
                            );
                    } else {
                        this.mailAttachment(observer, attachmentArray);
                    }
                }).catch(err => {
                    console.log('file write error', JSON.stringify(err));
                });
            } else {
                observer.error('empty_books');
            }
        });
    }
    movedToExternalTemp(imgName: string, attachmentArray: Array<string>): Observable<string> {
        return Observable.create(observer => {
            this.file.copyFile(
                this.file.dataDirectory,
                imgName,
                this.file.externalCacheDirectory,
                imgName
            ).then(fileEntry => {
                console.log('android img to external success-->', imgName);
                attachmentArray.push(this.file.externalCacheDirectory + imgName);
                observer.next();
                observer.complete();
            })
                .catch(err => {
                    console.log('android img to external failed-->', imgName);
                    observer.error();
                });
        });
    }
    mailAttachment(observer, attachmentArray: Array<string>) {
        console.log('attachmentArray-->', JSON.stringify(attachmentArray));
        let email = {
            attachments: attachmentArray,
            subject: 'MyBooks Export : ' + (new Date()).toDateString(),
            body: '<h4>If you are using iPhone</h4><ul><li>Save <b>export_books.json</b> file to iCloud.</li><li>Save all the other attached book cover images to photos(gallery).</li><li>These images will not show with the books automatically.</li><li>You have to go to book details and add the correct book cover from gallery.</li></ul> <h4>If you are using Android save images to gallery and update them manually.</h4>',
            isHtml: true,
        };
        this.emailComposer.open(email)
            .then(() => {
                observer.next();
                observer.complete();
            })
            .catch(() => {
                observer.error('mail_error');
            });
    }
    //------
}

//viragaya
//guru geethaya
//santhiyago nam serisaranna
//siddhartha
//kolara kale ale
//yakage navathen ? 
//suddilage katawa ?



