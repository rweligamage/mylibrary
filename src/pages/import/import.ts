import { Component, } from '@angular/core';
import { IonicPage, NavController, AlertController, } from 'ionic-angular';

import { DataSvc } from '../../providers/data-svc';

/**
 * Generated class for the Login page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
    selector: 'page-import',
    templateUrl: 'import.html',
})
export class Import {
    isProcessing: boolean;

    constructor(
        public navCtrl: NavController,
        public dataSvc: DataSvc,
        public alertCtrl: AlertController,
    ) { 
    }
    onClickSelectFile() {
        this.isProcessing = true;
        this.dataSvc.importBooksFromJson()
            .subscribe(
                data => {
                    this.navCtrl.push("Sync", { data: data}).catch(() => console.log('from song to add'));
                    this.isProcessing = false;
                },
                err => {
                    this.isProcessing = false;
                    //invalid_json, file_picker_error
                    if (err === 'invalid_json') {
                        this.showAlert("Error!", "Json content is not valid. Please check the json structure.");
                    } else if (err === 'invalid_file') {
                        this.showAlert("Error!", "Only .json files are supported.");
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
}


