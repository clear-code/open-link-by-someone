(function(global) {
  var MESSAGE_TYPE = 'open-link-by-someone';

  var messageListener = function(aMessage) {
    switch (aMessage.json.command) {
      case 'shutdown':
        global.removeMessageListener(MESSAGE_TYPE, messageListener);
        content.removeEventListener('click', eventListener, true);
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

    var link = target.href;
    if (matcher.test(link)) {
      global.sendAsyncMessage(MESSAGE_TYPE,
                              { href: link });
      aEvent.preventDefault();
      aEvent.stopImmediatePropagation();
      aEvent.stopPropagation();
    }
  };
  global.addEventListener('click', eventListener, true);
})(this);
