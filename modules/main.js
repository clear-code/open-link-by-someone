/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

load('lib/WindowManager');
load('lib/prefs');

var DOMAIN = 'extensions.open-link-by-someone@clear-code.com.';

var messageType = 'open-link-by-someone';
var matcher = null;

var messageListener = function(aMessage) {
  console.log('message from content');
  console.log(aMessage);
};

function initTab(aTab) {
  var script = 'chrome://open-link-by-someone/content/content.js';
  var manager = aTab.linkedBrowser.messageManager;
  manager.loadFromScript(script, true);
  manager.addMessageListener(messageType, messageListener);
  manager.sendAsyncMessage(messageType,
                           { command: 'update-matcher',
                             matcher: matcher });
}

function destroyTab(aTab) {
  var manager = aTab.linkedBrowser.messageManager;
  manager.removeMessageListener(messageType, messageListener);
  manager.sendAsyncMessage(messageType,
                           { command: 'shutdown' });
}

function handleTabOpen(aEvent) {
  var tab = aEvent.originalTarget;
  initTab(tab);
}

function handleUnload(aEvent) {
  var view = (aEvent.target.ownerDocument || aEvent.target).defaultView;
  view.removeEventListener('TabOpen', handleTabOpen, true);
  view.removeEventListener('unload', handleUnload, true);
}

const TYPE_BROWSER = 'navigator:browser';

function handleWindow(aWindow) {
  var doc = aWindow.document;
  if (doc.documentElement.getAttribute('windowtype') != TYPE_BROWSER)
    return;

  aWindow.addEventListener('TabOpen', handleTabOpen, true);
  aWindow.addEventListener('unload', handleUnload, true);
  Array.forEach(aWindow.gBrowser.tabContainer.childNodes, function(aTab) {
    if (aTab.localName != 'tab')
      return;
    initTab(aTab);
  });
}

WindowManager.getWindows(TYPE_BROWSER).forEach(handleWindow);
WindowManager.addHandler(handleWindow);

function shutdown() {
  WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
    aWindow.messageManager.sendAsyncMessage(messageType,
                                            { command: 'shutdown' });
    aWindow.removeEventListener('TabOpen', handleTabOpen, true);
    aWindow.removeEventListener('unload', handleUnload, true);
  });

  WindowManager = undefined;
  prefs = undefined;
}
