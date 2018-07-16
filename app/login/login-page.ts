import * as frameModule from 'ui/frame';
import { EventData } from 'tns-core-modules/data/observable';
import { Page } from 'ui/page';
import { isIOS, isAndroid } from 'tns-core-modules/platform';

declare const Crashlytics: any;
const appSettings = require('application-settings');
const modalPageModule = './login-modal/login-modal';
const context = '';
const fullscreen = true;
let page;

export function pageLoaded(args: EventData) {
  page = <Page>args.object;
  //crash();
}

export function openBrowser(args: any) {
  // check to see if this user has already successfully authenticated
  const token = appSettings.getString('untappdToken');

  if (token && token.length > 0) {
    var navigationOptions = {
      moduleName: './start/start-page',
      transition: {
        name: 'slideTop'
      }
    };
    frameModule.topmost().navigate(navigationOptions);
  } else {
    page.showModal(
      modalPageModule,
      context,
      (token: string) => {
        // Receive data from the modal page
      },
      fullscreen
    );
  }
}

function crash() {
  // this is just to force a crash to see if crashlytics is working!
  if (isIOS) {
    Crashlytics.sharedInstance().crash();
  }
}
