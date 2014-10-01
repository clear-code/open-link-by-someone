(function(global) {
  var DEBUG = false;

  function mydump(aMessage) {
    if (DEBUG)
      dump('open-link-by-someone: ' + aMessage + '\n');
  }

  mydump('CONTENT SCRIPT LOADED');
  var MESSAGE_TYPE = 'open-link-by-someone';

  var messageListener = function(aMessage) {
    mydump('CONTENT MESSAGE LISTENED');
    mydump(JSON.stringify(aMessage.json));
    switch (aMessage.json.command) {
      case 'shutdown':
        global.removeMessageListener(MESSAGE_TYPE, messageListener);
        global.removeEventListener('click', eventListener, true);
        messageListener = null;
        eventListener = null;
        return;

      case 'update-matcher':
        matcher = new RegExp(aMessage.json.matcher);
        return;
    }
  };
  global.addMessageListener(MESSAGE_TYPE, messageListener);

  var matcher = null;

  var eventListener = function(aEvent) {
    if (!matcher ||
        aEvent.button != 0 ||
        aEvent.altKey ||
        aEvent.ctrlKey ||
        aEvent.shiftKey ||
        aEvent.metaKey)
      return;

    var target = aEvent.target;
    if (!target.href && target.parentNode)
      target = target.parentNode;
    if (!target.href)
      return;

    mydump('CONTENT LINK CLICK ON '+target.href);
    var link = target.href;
    if (matcher.test(link)) {
      mydump('CONTENT LINK MATCHED!');
      global.sendAsyncMessage(MESSAGE_TYPE,
                              { href: link });
      aEvent.preventDefault();
      aEvent.stopImmediatePropagation();
      aEvent.stopPropagation();
    }
  };
  global.addEventListener('click', eventListener, true);
})(this);
