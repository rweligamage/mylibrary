import { NgModule, ErrorHandler, } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler, } from 'ionic-angular';
import { HttpModule } from '@angular/http';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';
import { Keyboard } from '@ionic-native/keyboard';
import { Camera } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import { Transfer } from '@ionic-native/transfer';
import { IonicStorageModule } from '@ionic/storage';
import { HTTP } from '@ionic-native/http';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { EmailComposer } from '@ionic-native/email-composer';
import { FileChooser } from '@ionic-native/file-chooser';


import { MyApp } from './app.component';

import { DataSvc } from '../providers/data-svc';
import { DeviceSvc } from '../providers/device-svc';
import { KeyboardSvc } from '../providers/keyboard-svc';

//add providers to each dependent module instead of app module

@NgModule({
    declarations: [
        MyApp,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp, {
            backButtonText: '',
        }),
        HttpModule,
        IonicStorageModule.forRoot(),
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
    ],
    providers: [
        StatusBar,
        SplashScreen,
        Network,
        Keyboard,
        Camera,
        File,
        Transfer,
        HTTP,
        BarcodeScanner,
        EmailComposer,
        FileChooser,
        
        { provide: ErrorHandler, useClass: IonicErrorHandler },

        DataSvc,
        DeviceSvc,
        KeyboardSvc,
    ],
    schemas: [],
})
export class AppModule {
    
}
