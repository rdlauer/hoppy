import * as frameModule from 'ui/frame';
import * as http from 'http';
import { EventData } from 'tns-core-modules/data/observable';
import { Page } from 'ui/page';
import * as firebase from 'nativescript-plugin-firebase';
const appSettings = require('application-settings');
const keys = require('../keys');
// import {
//   MLKitRecognizeTextOnDeviceResult,
//   MLKitRecognizeTextResultBlock
// } from 'nativescript-plugin-firebase/mlkit/textrecognition';
// import { MLKitScanBarcodesOnDeviceResult } from 'nativescript-plugin-firebase/mlkit/barcodescanning';

let scanCount = 0;
let page, scanner, flashlight;

export function pageLoaded(args: EventData) {
  page = <Page>args.object;
  scanner = page.getViewById('scanner');
  flashlight = page.getViewById('flashlight');
}

export function navigatedTo() {
  scanCount = 0;
  // android back button hack
  appSettings.setString('pageSource', './scan/scan-page');
}

export function toggleFlashlight() {
  if (!flashlight.checked) {
    scanner.torchOn = true;
  } else {
    scanner.torchOn = false;
  }
}

export function goBack(args: any) {
  scanner.torchOn = false;
  flashlight.checked = false;

  let navigationOptions = {
    moduleName: './start/start-page',
    transition: {
      name: 'slideBottom',
      clearHistory: true
    }
  };
  frameModule.topmost().navigate(navigationOptions);
}

// export function onTextRecognitionResult(scanResult: any): void {
//   const value: MLKitRecognizeTextOnDeviceResult = scanResult.value;
//   vm.set('blocks', value.blocks);
// }

export function onBarcodeScanningResult(scanResult: any) {
  if (scanResult.value.barcodes.length > 0 && scanCount == 0) {
    scanCount++;
    let code = scanResult.value.barcodes[0].value;
    // let url = 'https://api.upcdatabase.org/product/' + code + '/' + '';
    let url = keys.upcUrl + '?code=' + code + '&test=' + keys.test;

    http.getJSON(url).then(
      function(u: any) {
        if (u.id == null) {
          alert({
            title: 'Sorry!',
            message: "Couldn't find that beer!",
            okButtonText: 'OK',
            cancelable: false
          });
          return;
        }

        let navigationOptions = {
          moduleName: './detail/detail-page',
          context: {
            id: u.id,
            name: u.name,
            score: u.score,
            image: u.image,
            image_lg: '', // no large image returned from this api :(
            brewery: u.brewery,
            style: u.style,
            desc: u.desc,
            abv: u.abv,
            ibu: u.ibu,
            count: u.score_count,
            score_img_1: 'rating-detail ' + u.score_img_1,
            score_img_2: 'rating-detail ' + u.score_img_2,
            score_img_3: 'rating-detail ' + u.score_img_3,
            score_img_4: 'rating-detail ' + u.score_img_4,
            score_img_5: 'rating-detail ' + u.score_img_5
          }
        };

        scanner.torchOn = false;
        flashlight.checked = false;

        frameModule.topmost().navigate(navigationOptions);
      },
      function(error) {
        //console.error('ERROR: ' + error);
        scanner.torchOn = false;
        flashlight.checked = false;

        firebase.sendCrashLog({
          message: 'Error with UPC scanning: ' + error,
          showInConsole: true
        });
      }
    );
  }
}
