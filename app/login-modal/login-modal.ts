import * as frameModule from 'ui/frame';
import { ShownModallyData } from 'ui/core/view';
import { Page } from 'ui/page';
import { EventData } from 'tns-core-modules/data/observable';
const webViewModule = require('tns-core-modules/ui/web-view');
const appSettings = require('application-settings');
import * as firebase from 'nativescript-plugin-firebase';
let page, actLogin;

export function pageLoaded(args: EventData) {
  page = <Page>args.object;
  actLogin = page.getViewById('actLogin');
  actLogin.busy = true;
  setTimeout(function() {
    actLogin.busy = false;
  }, 3000);
}

export function onWebViewLoaded(webargs) {
  //const page = webargs.object.page;
  const webview = webargs.object;

  webview.on(webViewModule.WebView.loadFinishedEvent, args => {
    if (!args.error) {
      if (args.url.includes('#access_token')) {
        // successful auth!
        let token = args.url.replace('https://hoppyapp.com/auth.html#access_token=', '');

        appSettings.setString('untappdToken', token);

        closeCallback(token);

        var navigationOptions = {
          moduleName: './start/start-page',
          transition: {
            name: 'slideTop'
          }
        };
        frameModule.topmost().navigate(navigationOptions);
      }
    } else {
      //console.log(args.error);
      firebase.crashlytics.sendCrashLog({
        message: 'Error authenticating user: ' + args.error,
        showInConsole: true
      });
    }
  });
}

let context: any;
let closeCallback: Function;

export function onShowingModally(args: ShownModallyData) {
  context = args.context;
  closeCallback = args.closeCallback;
}
