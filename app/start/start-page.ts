import * as frameModule from 'ui/frame';
//import * as camera from 'nativescript-camera';
const appSettings = require('application-settings');

export function pageLoaded() {
  // calling this later
  //camera.requestPermissions();

  // this is a hack to prevent the camera from reappearing on back nav
  appSettings.setString('showCamera', 'yes');
}

export function onTapMenu(args: any) {
  var navigationOptions = {
    moduleName: './main/main-page',
    transition: {
      name: 'slideTop'
    }
  };
  frameModule.topmost().navigate(navigationOptions);
}

export function onTapScan(args: any) {
  var navigationOptions = {
    moduleName: './scan/scan-page',
    transition: {
      name: 'slideTop'
    }
  };
  frameModule.topmost().navigate(navigationOptions);
}
