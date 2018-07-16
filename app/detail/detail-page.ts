import { topmost } from 'ui/frame';
import { EventData } from 'data/observable';
import { Page } from 'ui/page';
import { availableSync } from 'nativescript-appavailability';
import { openUrl } from 'tns-core-modules/utils/utils';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import * as frameModule from 'ui/frame';
const observableModule = require('tns-core-modules/data/observable');
const vm = new observableModule.Observable();
const appSettings = require('application-settings');
let page, cpAbv, cpIbu, id;

export function goBack(args: any) {
  topmost().goBack();
}

export function backEvent(args: any) {
  // this is a hack for android as i am having trouble with a cached version of the page not showing up without actually navigating to the page again...
  let module = './main/main-page';
  if (appSettings.getString('pageSource')) {
    module = appSettings.getString('pageSource');
  }
  let navigationOptions = {
    moduleName: module,
    transition: {
      name: 'slideRight'
    }
  };
  frameModule.topmost().navigate(navigationOptions);
  args.cancel = true;
}

export function pageLoaded(args: EventData) {
  page = <Page>args.object;
  page.bindingContext = vm;

  cpAbv = page.getViewById('cpAbv');
  cpIbu = page.getViewById('cpIbu');

  let context = page.navigationContext;

  id = context.id;

  vm.set('name', context.name);
  vm.set('score', context.score);
  vm.set('image', context.image_lg || context.image);
  vm.set('brewery', context.brewery);
  vm.set('style', context.style);
  vm.set('desc', context.desc);
  vm.set('abv', context.abv);
  vm.set('ibu', context.ibu);
  vm.set('score_count', context.score_count);
  vm.set('score_img_1', context.score_img_1);
  vm.set('score_img_2', context.score_img_2);
  vm.set('score_img_3', context.score_img_3);
  vm.set('score_img_4', context.score_img_4);
  vm.set('score_img_5', context.score_img_5);

  //no idea why this has to be in a setTimeout to work???
  setTimeout(function() {
    if (typeof cpAbv.update === 'function') {
      cpAbv.update(30, parseFloat(parseFloat(context.abv).toFixed(2)));
    }
  }, 50);

  setTimeout(function() {
    if (typeof cpIbu.update === 'function') {
      cpIbu.update(70, parseInt(context.ibu));
    }
  }, 50);
}

export function openUntappd() {
  let url, message;
  const urlScheme = isIOS ? 'untappd://' : 'com.untappdllc.app';

  if (availableSync(urlScheme)) {
    //message = "using app";
    url = 'untappd://beer/' + id;
  } else {
    //message = "browser";
    url = 'https://untappd.com/b/---/' + id;
  }

  openUrl(url);
}
