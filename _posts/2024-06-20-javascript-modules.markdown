---
layout: post
title: "Module in Javascript"
date: 2024-06-20 00:16:00
summary: Summarize of module and how to use it in Javascript
description: Summarize of module and how to use it in Javascript
categories: javascript
---

Module in Javascript always confuses me. In this post, I will try to gather and summarize how to use it in Javascript.
I will split this post into 2 parts: module on NodeJS and module on browser.

# Module in NodeJS

## CommonJS

Originally, NodeJS introduces CommonJS as its native module system. So that we can, for example, write code like this:

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

Javascript's standard committee(a.k.a TC39) later introduces another module system, it is called ECMAScript Module or ESM. Naturally, NodeJS also adopts this standard and added support for ESM since NodeJS 14.

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
