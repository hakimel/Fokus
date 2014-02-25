# Fokus

Fokus uses JavaScript to emphasize anything you select by covering the rest of the page with semi-transparent black.

The library has no dependencies and weighs in at around 3kb. A <code>&lt;canvas&gt;</code> element is used to paint the cut-out cover. Works in most modern browsers except IE and touch devices.

If you want to use this on your site simply include the [fokus.min.js](https://github.com/hakimel/Fokus/blob/master/js/fokus.min.js) script.

[Check out the demo page](http://lab.hakim.se/fokus/).

[Get the Fokus Chrome extension](https://chrome.google.com/webstore/detail/flkkpmjbbpijiedjdgnhkcgopgnflehe).  
[Get the Fokus Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/fokus/) by @aaronraimist.  

## History

#### 0.5
- Faster selection animation
- Handle offset document element (```<html>```)
- Update selection immediately on scroll

#### 0.4
- Don't start selection on rightclick

#### 0.3
- Don't select elements of zero width and height
- Don't select br nodes

#### 0.2
- Animate change in cleared area
- Handle selection via keyboard

#### 0.1
- Initial release

## License

MIT licensed

Copyright (C) 2012-2013 Hakim El Hattab, http://hakim.se
