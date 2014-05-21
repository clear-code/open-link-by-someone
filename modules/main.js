/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

load('lib/WindowManager');
load('lib/prefs');

var DEBUG = false;

function mydump(aMessage) {
  if (DEBUG)
    dump(aMessage +'\n');
}

var DOMAIN         = 'extensions.open-link-by-someone@clear-code.com.';
var CONTENT_SCRIPT = 'chrome://open-link-by-someone/content/content.js?' + Date.now();
var MESSAGE_TYPE   = 'open-link-by-someone';

var allMatcher = null;
var handlers   = [];

function loadHandlers() {
  var globalPatterns = [];
  handlers = [];
  prefs.getDescendant(DOMAIN).forEach(function(aKey) {
    if (aKey.indexOf(DOMAIN) != 0)
      return;

    var matched = aKey.match(/(.+)\.patterns$/);
    if (!matched)
      return;

    var patterns = prefs.getPref(aKey);
    mydump(aKey+' = '+patterns);
    patterns = patterns.split(/[\s\|]+/);
    patterns = patterns.map(function(aPattern) {
      // parse as IE View compatible rules
      return aPattern.replace(/\\/g, '\\\\')
                     .replace(/\./g, '\\.')
                     .replace(/\?/g, '\\?')
                     .replace(/\//g, '\\/')
                     .replace(/\*/g, '\.*')
                     .replace(/\{/g, '\\{')
                     .replace(/\}/g, '\\}')
                     .replace(/\.\*\\./g, '\.*\\.?\\b');
    });
    mydump(' => '+JSON.stringify(patterns));

    var handler = {
      matcher: new RegExp('^(' + patterns.join('|') + ')')
    };

    var base = matched[1];

    var script = prefs.getPref(base + '.script');
    mydump('HANDLER SCRIPT: '+base + '.script'+' => '+script);
    if (script) {
      handler.script = script;
      handlers.push(handler);
      globalPatterns = globalPatterns.concat(patterns);
      mydump('HANDLER REGISTERED: '+uneval(handler));
      return;
    }
  });

  if (globalPatterns.length > 0)
    allMatcher = '^(' + globalPatterns.join('|') + ')';
  else
    allMatcher = null;

  WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
    aWindow.messageManager.broadcastAsyncMessage(MESSAGE_TYPE,
                                                 { command: 'update-matcher',
                                                   matcher: allMatcher });
  });
}

var prefListener = {
  domain: DOMAIN,
  observe: function(aSubject, aTopic, aData) {
    if (aTopic != 'nsPref:changed')
      return;
    loadHandlers();
  }
};
prefs.addPrefListener(prefListener);

var messageListener = function(aMessage) {
  mydump('CHRONE MESSAGE LISTENED');
  mydump(JSON.stringify(aMessage.json));
  var window = aMessage.target.ownerDocument.defaultView;
  var href = aMessage.json.href;

  handlers.some(function(aHandler) {
    if (!aHandler.matcher.test(href))
      return false;

    mydump('HANDLER MATCHED: '+uneval(aHandler));

    if (aHandler.script) {
      try {
        let handler = new Function('window', 'href', aHandler.script);
        handler.call(window, window, href);
      }
      catch(e) {
        console.log('open-link-by-someone: failed to handle ' + href +', script = ' + aHandler.script);
        console.log(e);
      }
    }

    return true;
  });
};

function initTab(aTab) {
  var manager = aTab.linkedBrowser.messageManager;
  manager.loadFrameScript(CONTENT_SCRIPT, true);
  manager.addMessageListener(MESSAGE_TYPE, messageListener);
  manager.sendAsyncMessage(MESSAGE_TYPE,
                           { command: 'update-matcher',
                             matcher: allMatcher });
}

function destroyTab(aTab) {
  var manager = aTab.linkedBrowser.messageManager;
  manager.removeMessageListener(MESSAGE_TYPE, messageListener);
  manager.sendAsyncMessage(MESSAGE_TYPE,
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

loadHandlers();

function shutdown() {
  WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
    aWindow.messageManager.broadcastAsyncMessage(MESSAGE_TYPE,
                                                 { command: 'shutdown' });
    aWindow.removeEventListener('TabOpen', handleTabOpen, true);
    aWindow.removeEventListener('unload', handleUnload, true);
  });

  prefs.removePrefListener(prefListener);

  WindowManager = undefined;
  prefs = undefined;
}
