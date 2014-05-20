(function(global) {
  var messageType = 'open-link-by-someone';
  var messageListener = function(aMessage) {
    switch (aMessage.json.command) {
      case 'shutdown':
        global.removeMessageListener(messageType, messageListener);
        content.removeEventListener('click', eventListener, true);
        return;

      case 'update-matcher':
        matcher = new RegExp(aMessage.json.matcher);
        return;
    }
  };
  global.addMessageListener(messageType, messageListener);

  var matcher = null;

  var eventListener = function(aEvent) {
    if (!matcher)
      return;

    var target = aEvent.target;
    if (!target.href && target.parentNode)
      target = target.parentNode;
    if (!target.href)
      return;

    var link = target.href;
    if (matcher.test(link)) {
      global.sendAsyncMessage(messageType,
                              { href:     link,
                                altKey:   aEvent.altKey,
                                ctrlKey:  aEvent.ctrlKey,
                                shiftKey: aEvent.shiftKey,
                                metaKey:  aEvent.metaKey });
      aEvent.preventDefault();
      aEvent.stopImmediatePropagation();
      aEvent.stopPropagation();
    }
  };
  content.addEventListener('click', eventListener, true);
})(this);
