import { Injectable } from '@angular/core';
import { Keyboard } from '@ionic-native/keyboard';
import { Observable } from 'rxjs/Observable';
import { Platform } from 'ionic-angular';
import 'rxjs/Rx';
/*
  Generated class for the KeyboardSvcProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class KeyboardSvc {
    constructor(
        private keyboard: Keyboard,
        public plt: Platform,
    ) {
        console.log('KEYBOARDSVC');
    }
    afterKeyboardHidden(): any {
        return Observable.create(observer => {
            if (this.plt.is('cordova')) {
                if (window["cordova"].plugins.Keyboard.isVisible) {
                    this.keyboard.onKeyboardHide().subscribe(() => {
                        observer.next("closed");
                        observer.complete();
                    });
                    this.keyboard.onKeyboardHide();
                } else {
                    observer.next("closed");
                    observer.complete();
                }
            } else {
                observer.next("closed");
                observer.complete();
            }
        });
    }
}