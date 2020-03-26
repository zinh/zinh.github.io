---
layout: post
title: "Build your own React, part 1: DOM generator"
date: 2020-03-25 00:16:00
summary: In order to understand a little bit more about React, I've set a goal to build myself a library with the same functionality as React. In this post, I will begin with DOM generation and JSX.
description: In order to understand a little bit more about React, I've set a goal to build myself a library with the same functionality as React. In this post, I will begin with DOM generation and JSX.
categories: javascript
---

In this series, I would like to make myself a library that behave like React. In this post, I will start with generate DOM from JSX. Later on, other topics such as class, functional component, reconciliation, fiber, concurrent mode and hooks will be covered.

Before we begin, let's review some of browser API to manipulate DOM node.

# Basic DOM node manipulation

We just need to know some of the basic DOM manipulation functions:

- document.createElement(tagName[, options]) [ref](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement){:rel="nofollow"}
- document.createTextNode(data) [ref](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTextNode){:rel="nofollow"}
- Node.appendChild(child) [ref](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild){:rel="nofollow"}
- Node.replaceChild(newChild, oldChild) [ref](https://developer.mozilla.org/en-US/docs/Web/API/Node/replaceChild){:rel="nofollow"}
- Node.removeChild(child) [ref](https://developer.mozilla.org/en-US/docs/Web/API/Node/replaceChild){:rel="nofollow"}

No need to explain as the function name is quite clear but you can follow the reference url to read more about each functions.
As an example, let's convert this HTML to the equivalent JS

```html
<div class="search-form">
  <label>Search</label>
  <input name="keyword" type="text"/>
</div>
```

our Javascript version will be

```js
let divNode = document.createElement('div');
divNode.setAttribute('class', 'search-form');

let labelNode = document.createElement('label');
let labelText = document.createTextNode('Search');
labelNode.appendChild(labelText);

divNode.appendChild(labelNode);

let inputNode = document.createElement('input');
inputNode.setAttribute('name', 'keyword');
inputNode.setAttribute('type', 'text');

divNode.appendChild(inputNode);
```

# JSX

JSX is just syntatic sugar for Javascript(specifically React) that ease the pain of writing HTML code in Javascript, but in fact, we can use React without any JSX.

We can use Babel repl(at https://babeljs.io/repl) to see what JSX will be translated to, for example:

```html
<div class="search-form">
  <label>Search</label>
  <input name="keyword" type="text"/>
</div>
```

will be translate into this JS snippet

```js
React.createElement(
  "div",
  {
    class: "search-form"
  },
  React.createElement("label", null, "Search"),
  React.createElement("input", {
    name: "keyword",
    type: "text"
  })
);
```

Here we can see our first exposed function from React which is `createElement`. Another one is `render` and these two functions are all we need to implement.

# Implement createElement

`createElement` is a simple function that take a node type, its properties and return an object to represent it. We will call this object an element. So what will our element looks like?

It will have a `type` key, indicate type of this element, whether it's a DOM or a class component, etc.

It also needs a `props` containing all of its properties and children.

```js
let createElement = (type, options, ...children) => {
  return {
    type,
    props: Object.assign({ children }, options)
  }
}
```

Now, if we look at `children` part, we can see there are two types of children:
  - The one created by `React.createElement`
  - A simple string such as the string "Search" in `React.createElement("label", null, "Search"),`

So, to unite these two types, we need to change our function a little bit.
If it's a string, we will return an element with type of `TEXT_NODE` and only one props which is its text content.
Of course, there are more types in React, in fact, 2 more: Class component and functional component. We will implement these types in later posts.

```js
let createElement = (type, options, ...children) => {
  return {
    type,
    props: Object.assign(
      { children: children.map(child => 
        typeof child == 'string' 
        ? {type: 'TEXT_NODE', props: {value: child}}
        : child
      )},
      options
    )
  }
}
```

# Implement render

The element created by `createElement` will be passed to `render` function in order to actually create a DOM node and add it to DOM tree.

For now, our render will be as simple as:

```js
let render = (element, parentNode) => {
  let node = createInstance(element.type, element.props);
  parentNode.appendChild(node);
}
```

In `props`, there are three types of keys:

- attribute
- event
- `children`

We will have a convention such that event is any thing that start with `on`(eg: onClick, onBlur), otherwise it's a HTML attribute.

```js
// Some helper functions
let isAttribute = attrName => attrName != 'children' && !isEvent(attrName);
let isEvent = attrName => attrName.startsWith('on');
let eventName = event => event.substring(3).toLowerCase();

let createInstance = (type, props) => {
  // now we will handle our first and most simple element type, ie: TEXT_NODE
  if (type == 'TEXT_NODE') {
    return document.createTextNode(props.value);
  }

  // This is our second type, for now it's just a string indicate a DOM node's type
  let node = document.createElement(type);

  for(let key in props) {
    if (isEvent(key))
      node.addEventListener(eventName(key), props[event])
    else if (isAttribute(key))
      node.setAttribute(key, props[key])
  }

  // loop through children and recursivelly create them
  let children = props.children || [];
  children.forEach(child => {
    let childNode = createInstance(child.type, child.props);
    // then append to it's parent
    node.appendChild(childNode);
  })
  return node;
}
```

That is all that we need to render a JSX. Here are the full code of this first part:

[codepen](https://codepen.io/harue/pen/NWqOmjx){:rel="nofollow"}

In my next post, I will implement the remaining types of element, which is Class Component and Functional Component.
