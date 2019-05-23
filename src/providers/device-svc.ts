import { Injectable } from '@angular/core';
import { Platform, ActionSheetController, } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import { File } from '@ionic-native/file';
import { ImagePath } from '../model/types';

declare var Connection;

/*
  Generated class for the DeviceSvcProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class DeviceSvc {

    onDevice: boolean = false;
    options: CameraOptions = {
        quality: 50,
        destinationType: this.camera.DestinationType.FILE_URI, //Camera.DestinationType.FILE_URI. DATA_URL
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        correctOrientation: true,
    };

    constructor(
        public platform: Platform,
        public network: Network,
        public camera: Camera,
        public actionSheetCtrl: ActionSheetController,
        public file: File,
    ) {
        console.log('DEVICESVC');
        this.onDevice = this.platform.is('cordova');
    }
    isDevice(): boolean {
        return this.onDevice;
    }
    isOnline(): boolean {
        if (this.onDevice && this.network.type) {
            return this.network.type !== Connection.NONE;
        }
        return navigator.onLine;
    }
    isOffline(): boolean {
        if (this.onDevice && this.network.type) {
            return this.network.type === Connection.NONE;
        }
        return !navigator.onLine;
    }
    captureImage(): Observable<ImagePath> {
        return Observable.create(observer => {
            let actionSheet = this.actionSheetCtrl.create({
                title: 'Add book cover',
                buttons: [
                    {
                        text: 'From camera',
                        handler: () => {
                            this.captureImageFrom(this.camera.PictureSourceType.CAMERA, observer);
                        }
                    }, {
                        text: 'From gallery',
                        handler: () => {
                            this.captureImageFrom(this.camera.PictureSourceType.PHOTOLIBRARY, observer);
                        }
                    }, {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            observer.error("canceled");
                        }
                    }
                ]
            });
            actionSheet.present().catch((e) => console.log('action sheed presetn err---', e));
        });
    }
    captureImageFrom(type, observer) {
        let optionObj = Object.assign({}, this.options, { sourceType: type });
        console.log(optionObj);
        this.camera.getPicture(optionObj).then((imageData) => {
            //android camera  -> file:///storage/emulated/0/Android/data/lk.rcw.library/cache/1523961329350.jpg
            //android gallery -> file:///storage/emulated/0/Android/data/lk.rcw.library/cache/1523958279986.jpg?1523964901807
            console.log('suc-->', imageData);
            this.copyImageToPersist(imageData, observer);
        }, (err) => {
            console.log('fail-->', JSON.stringify(err));
            observer.error("error");
        });
    }
    copyImageToPersist(imageFileUrl: string, observer) {
        let lastSlashIndex = imageFileUrl.lastIndexOf("/");
        let pathToOrgFile = imageFileUrl.substring(0, lastSlashIndex + 1);
        let orgFileName = imageFileUrl.substr(lastSlashIndex + 1);
        if (orgFileName.indexOf('?') > -1){
            let spArr = orgFileName.split('?');
            orgFileName = spArr[0];
        }
        let newFileName = (new Date()).getTime() + ".jpg";

        console.log('pathToOrgFile->', pathToOrgFile);
        console.log('orgFileName->', orgFileName);

        this.file.copyFile(
            pathToOrgFile, //this.file.tempDirectory - is only for ios,  null on android
            orgFileName,
            this.file.dataDirectory,  //file:///data/data/lk.rcw.library/files/ on android
            newFileName
        ).then(newFileEntry => {
            console.log('copy img success-->', newFileEntry.nativeURL);
            // let copiedFilePath = newFileEntry.nativeURL.substr("file://".length);
            let passData: ImagePath = {
                type: 'local',
                filePath: newFileName
            };
            observer.next(passData);
            observer.complete();
        }).catch(err => {
            console.log('copy img fail-->',JSON.stringify(err))
            observer.error();
        })
    }
}

//"file:///var/mobile/Containers/Data/Application/38CE8897-56D3-4F6A-A030-9D1DA88E09AA/tmp/cdv_photo_001.jpg" file exits