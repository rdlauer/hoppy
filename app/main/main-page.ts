import { EventData } from 'data/observable';
import { Page } from 'ui/page';
import * as camera from 'nativescript-camera';
import * as http from 'http';
//import { isIOS, isAndroid } from 'tns-core-modules/platform';
import * as frameModule from 'ui/frame';
import {
  connectionType,
  getConnectionType
} from 'tns-core-modules/connectivity';
const imageSourceModule = require('tns-core-modules/image-source');
const firebase = require('nativescript-plugin-firebase');
const observableModule = require('tns-core-modules/data/observable');
const observableArrayModule = require('tns-core-modules/data/observable-array');
const appSettings = require('application-settings');
const keys = require('../keys');
const vm = new observableModule.Observable();

let page, prgsInterval, cp1, skeleton;
let prgs = 0;
let beerArray = new observableArrayModule.ObservableArray([]);
let token = appSettings.getString('untappdToken');

export function navigatedTo(args: EventData) {
  page = <Page>args.object;
  cp1 = page.getViewById('cp1');
  skeleton = page.getViewById('skeleton');
  page.bindingContext = vm;

  // android back hack
  appSettings.setString('pageSource', './main/main-page');

  // check to make sure we have a valid network connection
  checkNetwork();

  // hack to only automatically display camera the first time this view is shown
  let showCamera = appSettings.getString('showCamera');

  if (showCamera && showCamera == 'yes') {
    takePicture();
    appSettings.setString('showCamera', 'no');
  }
}

function startProgress() {
  if (typeof cp1.update === 'function') {
    cp1.update(100, prgs++);
  }
}

function stopProgress() {
  clearInterval(prgsInterval);
  cp1.visibility = 'collapse';
  skeleton.visibility = 'collapse';
}

function checkBeerLength(beer) {
  return beer.length > 10 && beer.length < 50;
}

export function beerTap(args: any) {
  const index = args.index;

  let navigationOptions = {
    moduleName: './detail/detail-page',
    context: {
      id: beerArray[index].id,
      name: beerArray[index].name,
      score: beerArray[index].score,
      image: beerArray[index].image,
      image_lg: beerArray[index].image_lg,
      brewery: beerArray[index].brewery,
      style: beerArray[index].style,
      desc: beerArray[index].desc,
      abv: beerArray[index].abv,
      ibu: beerArray[index].ibu,
      score_count: beerArray[index].score_count,
      score_img_1: beerArray[index].score_img_1.replace(
        'rating-list',
        'rating-detail'
      ),
      score_img_2: beerArray[index].score_img_2.replace(
        'rating-list',
        'rating-detail'
      ),
      score_img_3: beerArray[index].score_img_3.replace(
        'rating-list',
        'rating-detail'
      ),
      score_img_4: beerArray[index].score_img_4.replace(
        'rating-list',
        'rating-detail'
      ),
      score_img_5: beerArray[index].score_img_5.replace(
        'rating-list',
        'rating-detail'
      )
    }
  };

  frameModule.topmost().navigate(navigationOptions);
}

export function takePicture() {
  camera.requestPermissions().then(() => {
    camera
      .takePicture({
        saveToGallery: false
      })
      .then(imageAsset => {
        // set up the progress circle
        cp1.visibility = 'visible';
        skeleton.visibility = 'visible';
        prgs = 0;
        beerArray = [];
        prgsInterval = setInterval(startProgress, 50);

        const source = new imageSourceModule.ImageSource();
        source.fromAsset(imageAsset).then(imageSource => {
          firebase.mlkit.textrecognition
            .recognizeTextCloud({
              image: imageSource,
              modelType: 'latest', // either "latest" or "stable" (default "stable")
              maxResults: 25 // default 10
            })
            .then(function(result) {
              // filter out prices, text between parens, text between brackets
              let filtered = result.text.replace(
                /(\$[0-9]+(\.[0-9]{2})?)/g,
                ''
              );
              filtered = filtered
                .replace(/ *\([^)]*\) */g, '')
                .replace(/ *\[[^\]]*]/g, '')
                .trim();

              // create array of text from firebase
              let beers = filtered.split('\n').filter(checkBeerLength);

              if (beers.length == 0) {
                showNoBeerAlert();
              }

              for (let i = 0; i < beers.length; i++) {
                //if (beers[i].trim().length > 10 && beers[i].trim().length < 50) {
                let url =
                  keys.searchUrl +
                  '?query=' +
                  encodeURIComponent(beers[i].trim().replace(/ /g, '%20')) +
                  '&access_token=' +
                  token +
                  '&test=' +
                  keys.test;

                http.getJSON(url).then(
                  function(u: any) {
                    if (u.id && u.id != 0) {
                      beerArray.push({
                        id: u.id,
                        name: u.name,
                        score: u.score,
                        image: u.image,
                        image_lg: u.image_lg,
                        brewery: u.brewery,
                        style: u.style,
                        desc: u.desc,
                        abv: u.abv,
                        ibu: u.ibu,
                        count: u.score_count,
                        score_img_1: 'rating-list ' + u.score_img_1,
                        score_img_2: 'rating-list ' + u.score_img_2,
                        score_img_3: 'rating-list ' + u.score_img_3,
                        score_img_4: 'rating-list ' + u.score_img_4,
                        score_img_5: 'rating-list ' + u.score_img_5
                      });
                    }
                    // add the completed array to the viewmodel
                    if (i == beers.length - 1) {
                      vm.set('myBeers', beerArray);
                      stopProgress();

                      if (beerArray.length == 0) {
                        showNoBeerAlert();
                      }
                    }
                  },
                  function(error) {
                    //console.log('ERROR: ' + error);
                    firebase.sendCrashLog({
                      message: 'Error with Hoppy/Untappd API: ' + error,
                      showInConsole: true
                    });
                  }
                );
                //}
              }
            })
            .catch(function(errorMessage) {
              //console.log('MLKIT ERROR: ' + errorMessage);
              firebase.sendCrashLog({
                message: 'Error with ML Kit: ' + errorMessage,
                showInConsole: true
              });
              alert({
                title: 'Error!',
                message: 'Sorry, but we ran into a little problem...',
                okButtonText: 'OK',
                cancelable: false
              });
            });
        });
      })
      .catch(function(err) {
        alert({
          title: 'Camera Issue!',
          message: err.message,
          okButtonText: 'OK',
          cancelable: false
        });
      });
  });
}

export function goBack(args: any) {
  let navigationOptions = {
    moduleName: './start/start-page',
    transition: {
      name: 'slideBottom',
      clearHistory: true
    }
  };
  frameModule.topmost().navigate(navigationOptions);
}

function showNoBeerAlert() {
  alert({
    title: 'No Beers Found',
    message: "Sorry, but we couldn't find any beer names in the menu!",
    okButtonText: 'OK',
    cancelable: false
  });
}

function checkNetwork() {
  // result is ConnectionType enumeration (none, wifi or mobile)
  const myConnectionType = getConnectionType();

  switch (myConnectionType) {
    case connectionType.none:
      // Denotes no Internet connection.
      //console.log('No connection');
      alert({
        title: 'No Internet',
        message: 'Sorry, but you need an active network connection!',
        okButtonText: 'OK',
        cancelable: false
      });
      break;
    case connectionType.wifi:
      // Denotes a WiFi connection.
      //console.log('WiFi connection');
      break;
    case connectionType.mobile:
      // Denotes a mobile connection, i.e. cellular network or WAN.
      //console.log('Mobile connection');
      break;
    case connectionType.ethernet:
      // Denotes a ethernet connection.
      //console.log('Ethernet connection');
      break;
    default:
      break;
  }
}
