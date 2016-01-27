## What is same origin/cross origin?

### Same origin: access from the same domain and same scheme(http or https)

Example:

http://example.com → http://example.com/home.html: same origin
https://example.com → https://example.com/home.html: same origin

### Cross origin: access from different domain or different scheme.

Example:

__http__://example.com → __https__://example.com/home.html: cross origin
https://google.com → https://gmail.com: cross origin.

## Default referrer policy

Defaultly, when access from the same origin, a referrer header will be set. For example:

When moving from http://example.com/home.html to http://example.com/list.html the referrer header will be "http://example.com/home.html"

When access from cross origin, referrer header will not be set. For example:

http://example.com/home.html → https://example.com/list.html: referrer header = blank
https://google.com → https://gmail.com: referrer header = blank

## How can we change default referrer policy?

We can change default referrer policy by using `referrer` meta tag, as follow:

```html
<meta name="referrer" content="origin">
```

## Referrer option

### no-referrer: no referrer is set, even from same origin

Sample:

http://example.com/home.html → http://example.com/list.html: referrer header = blank
https://google.com → https://gmail.com: referrer header = blank

### origin: referrer is always set, and equal to root path

http://example.com/home.html → http://example.com/list.html: referrer header = "http://example.com"
http://example.com/home.html → https://example.com/list.html: referrer header = "http://example.com"
https://example.com/home.html → https://google.com: referrer header = "https://example.com"

### origin-when-cross-origin: full path referrer if from same origin and root path referrer if cross origin.

Example:

http://example.com/home.html → http://example.com/list.html: referrer header = "http://example.com/home.html"
__http__://example.com/home.html → __https__://example.com/list.html: referrer header = "http://example.com"
https://example.com/home.html → https://google.com: referrer header = "https://example.com"

### unsafe-url: referrer is always set to full-path even when accessing from cross domain

http://example.com/home.html → http://example.com/list.html: referrer header = "http://example.com/home.html"
__http__://example.com/home.html → __https__://example.com/list.html: referrer header = "http://example.com/home.html"
https://example.com/home.html → https://google.com: referrer header = "https://example.com/home.html"

## Caution
- Changing referrer policy is not standard. It is implemented in __Firefox__ and __Webkit__(Chrome, Safari), but not yet in __IE__.
- Pay attention to `redirect_to(:back)` when using `origin` option.

## Reference

- http://w3c.github.io/webappsec/specs/referrer-policy
