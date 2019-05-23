import { Component, ViewChild, NgZone, } from '@angular/core';
import { Platform, Nav, LoadingController, AlertController, } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from '@ionic-native/keyboard';

import { DataSvc } from '../providers/data-svc';


@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) navCtrl: Nav;

    rootPage: any;
    backdropLoader: any;
    countWishList: number;
    countBookList: number;

    constructor(
        platform: Platform,
        statusBar: StatusBar,
        splashScreen: SplashScreen,
        private keyboard: Keyboard,
        public loadingCtrl: LoadingController,
        public dataSvc: DataSvc,
        public alertCtrl: AlertController,
        public ngZone: NgZone,
    ) {
        platform.ready().then(() => {
            console.log('device is ready now----');
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            splashScreen.hide();
            this.keyboard.hideKeyboardAccessoryBar(false);
            this.rootPage = "Home";
        });
    }
    beforeOpeningMenu() {
        this.ngZone.run(() => {
            this.countWishList = this.dataSvc.getWishBookList().length;
            this.countBookList = this.dataSvc.getMyBookList().length;
        });
    }
    onClickItem(item: string) {
        if (item === 'wishlist') {
            this.navCtrl.push("Wish").catch(() => console.log('from song to add'));
        } else if (item === 'import') {
            this.navCtrl.push("Import").catch(() => console.log('from song to add'));
        } else if (item === 'export') {
            this.showRadioConfirmation();
        } else if (item === 'help') {
            this.navCtrl.push("Help").catch(() => console.log('from song to add'));
        } 
        // else if (item === 'sort') {
        //     this.navCtrl.push("Sort").catch(() => console.log('from song to add'));
        // }
    }
    showRadioConfirmation() {
        let alert = this.alertCtrl.create();
        alert.setTitle('Which list you want to export?');

        alert.addInput({
            type: 'radio', label: 'My Books List', value: 'mybooks', checked: true
        });
        alert.addInput({
            type: 'radio', label: 'Wish List', value: 'wishbooks', checked: false
        });
        alert.addButton('Cancel');
        alert.addButton({
            text: 'OK',
            handler: data => {
                this.exportList(data);
            }
        });
        alert.present().catch(() => { console.log('alert dismiss catch'); });
    }
    exportList(listType: string) {
        this.showBackDropLoader();
        this.dataSvc.exportBooksList(listType)
            .subscribe(
                data => {
                    this.backdropLoader.dismiss().catch(() => console.log('from song to add'));
                },
                err => {
                    this.backdropLoader.dismiss().catch(() => console.log('from song to add'));
                }
            );
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