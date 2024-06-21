---
layout: post
title: "Module in JavaScript"
date: 2024-06-20 00:16:00
summary: JavaScript modules can be a puzzling concept for many developers. In this post, I will try to gather and summarize how to use them effectively. I will split this post into two parts covering modules in the NodeJS environment and those used in the browser environment.
description: Summarize of module and how to use it in JavaScript
categories: javascript
---

JavaScript modules can be a puzzling concept for many developers. In this post, I will try to gather and summarize how to use them effectively. I will split this post into two parts: covering modules in the NodeJS environment and those used in the browser environment.

# Module in NodeJS

## CommonJS

Traditionally, NodeJS relied on the CommonJS module system for managing code. This system allows developers to use the `require` statement to import functionalities from other files.

```js
// a.js
const add = (a, b) => a + b;
exports.add = add;

// b.js: uses require to call a.js
const { add } = require('./a.js');
console.log(add(1, 2));
```

CommonJS is the default when NodeJS intepretes a `.js` file. We can explicit tell NodeJS that a file should be read as CommonJS by one of the following methods:
- Uses `.cjs` extension; or
- Add a `"type": "commonjs"` to top-level package.json

## ESM

The ECMAScript Technical Committee (TC39), which defines the standard for JavaScript, later introduced another module system called ECMAScript Modules (ESM). Naturally, NodeJS adopted this standard and began supporting ESM starting with version 14.

ESM includes the keyword import/export. Here is an example:

```js
// a.js
const add = (a, b) => a + b;
export { add }

// b.js
import { add } from './a.js';
console.log(add(1,2));
```

By default, NodeJS doesn't implicitly consider a .js file ESM. Therefore, if you run this example, you'll get the error `SyntaxError: Cannot use import statement outside a module`. We need to specify an ESM by:

- Use .mjs file extension; or
- Add a "type": "module" to top-level package.json

## Calling between CommonJS and ESM

We can call an ESM from a CommonJS module or vice versa by using the function `async import()`, for example:

```js
// a.mjs
const add = (a, b) => a + b;
export { add }

// b.cjs
import('./a.mjs').then(m => {
    console.log(m.add(1, 2));
})
```

Current version of NodeJS also introduce a experiental flag `--experimental-require-module` that allows calling ESM by using require given that:
- The module is fully synchronous (contains no top-level await); and
- One of these conditions:
  - The file has a .mjs extension.
  - The file has a .js extension, and the closest package.json contains "type": "module"
  - The file has a .js extension, the closest package.json does not contain "type": "commonjs", and --experimental-detect-module is enabled.

So the advice here is if it's your own code, try to be as explicit as possible such as using the `.mjs` and `.cjs` extension.

# Module in browser

JavaScript originally lacked a proper module system. To include libraries like jQuery, developers added a script tag in their HTML file.

```js
<script type="javascript" src="jquery.js"></script>
```

The browser's JavaScript engine would then load and execute this external JavaScript file. Often, such libraries would define a global variable (e.g., window.jQuery = ...) to make their functionality accessible throughout the page.

This approach served as the standard for a while. Then came build tools like Webpack, Gulp, and Parcel. These tools allow for better project structure by enabling you to organize your code into smaller modules. You can use export and import statements to manage dependencies between these modules, and the build tool will bundle them into a single file optimized for the browser.

Around 2017, the ECMAScript Modules (ESM) standard arrived, allowing developers to directly use import and export keywords within their client-side JavaScript code.

## ESM in browser

We can declare our `.js` file an ESM module by set the type attribute of script tag to module, ie:

```html
<script type="module" src="./main.js"></script>

<!-- or directly inside script !>
<script type="module">
  import { add } from './main.js';
  console.log(add(1,2));
</script>

<!-- without type=module, usaged of import/export will raise error !>
<script>
  import { add } from './main.js'; // will raise SyntaxError
</script>
```

then inside `main.js` we can use import/export statement.

```js
// main.js
import { add } from './lib.js';
console.log(add(1,2));
```

＊While the `.mjs` extension might be tempting for these types of files, browsers are quite strict about the MIME type for JavaScript files. Therefore, if your server is configured to return the correct MIME type (`text/javascript`) for `.mjs` files, you can use this extension. Otherwise, it's best to stick with the `.js` extension on the browser side for better compatibility.

## importmap

To make it easier to import module from an URL, we can use importmap.

```html
<script type="importmap">
{
    "imports": {
        "react": "https://esm.sh/react@18.3.1",
        "react-dom": "https://esm.sh/react-dom@18.3.1"
    }
}
</script>

<!-- in our module we can import from React !>
<script type="module">
  // instead of import React from "https://esm.sh/react@18.2.0"
  // we can use:
  import React from "react";
  import { createRoot } from "react-dom";
</script>
```

＊importmap is generally available since 2023 which is quite new at the time of this post.
