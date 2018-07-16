import './bundle-config';
import * as application from 'application';
import firebase = require('nativescript-plugin-firebase');
import * as frameModule from 'ui/frame';

firebase
  .init({
    // Optionally pass in properties for database, authentication and cloud messaging,
    // see their respective docs.
  })
  .then(
    instance => {
      console.log('firebase.init done');
    },
    error => {
      //console.log(`firebase.init error: ${error}`);
      firebase.sendCrashLog({
        message: `Error initializing firebase: ${error}`,
        showInConsole: true
      });
    }
  );

// android back button hack

if (application.android) {
  application.android.on(
    application.AndroidApplication.activityBackPressedEvent,
    backEvent
  );
}

function backEvent(args) {
  let currentPage: any = frameModule.topmost().currentPage;
  if (
    currentPage &&
    currentPage.exports &&
    typeof currentPage.exports.backEvent === 'function'
  ) {
    currentPage.exports.backEvent(args);
  }
}

application.run({ moduleName: 'app-root' });
