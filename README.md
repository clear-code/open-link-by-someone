open-link-by-someone
====================

This is a bridge for any addons which can handle an URI as its input, ex. Chrome View.

pref("extensions.open-link-by-someone@clear-code.com.ChromeView.patterns",
     "http://www.example.com/ http://example.jp/path/to/page*");
pref("extensions.open-link-by-someone@clear-code.com.ChromeView.handler",
     "script");
pref("extensions.open-link-by-someone@clear-code.com.ChromeView.script",
     "window.chromeview.launch(href)");

