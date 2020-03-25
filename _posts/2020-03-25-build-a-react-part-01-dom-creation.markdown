---
layout: post
title: "Build your own React: DOM generator"
date: 2020-01-30 15:16:00
summary: In order to understand a little bit more about React, I've set my goal to build myself a library with the same functionality as React. In this post, we will begin with DOM generation and JSX.
description: In order to understand a little bit more about React, I've set my goal to build myself a library with the same functionality as React. In this post, we will begin with DOM generation and JSX.
categories: javascript
---

# Basic DOM node manipulation

We just need to know some of the basic DOM manipulation functions:

- document.createElement(tagName[, options])
- document.createTextNode(data)
- Node.appendChild(child)
- Node.replaceChild(newChild, oldChild)
- Node.removeChild(child)

For example, to create the html as below:

```html
<div class="search-form">
  <label>Search</label>
  <input name="keyword" type="text"/>
</div>
```

the equivalent JS will be:

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

JSX is really just a syntatic sugar for Javascript(specifically React).

We can use Babel repl(at https://babeljs.io/repl) to see what it translate a JSX into JS:

```html
<div class="search-form">
  <label>Search</label>
  <input name="keyword" type="text"/>
</div>
```

```js
React.createElement(
  "div",
  {
    className: "search-form"
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

```js
let createElement = (type, options, ...children) => {
  // In this post, type is just simple string to represent a DOM Node type
  // There are other types(component class and functional) 
  //   that will be implemented in later post.
  return {
    type,
    props: Object.assign({ children }, options)
  }
}
```

Now, if we look at children part, we can see there are two types of children:
  - The one created by `React.createElement`
  - A simple string

So, to unite these two types, we have to change our function a little bit

```js
let createElement = (type, options, ...children) => {
  return {
    type,
    props: Object.assign(
      { children: children.forEach(child => 
          typeof child == 'string' 
            ? {type: 'TEXT_NODE', props: {value: chld}}
            : child
      )},
      options
    )
  }
}
```

# Implement render

The element created by `createElement` will be passed to render function in order to actually create a DOM and add it to DOM tree.

```js
let render = (element, parentNode) => {
  let node = createInstance(element.type, element.props);
  parentNode.appendChild(node);
}
```

in props, there are three types of keys:
- attribute
- event
- `children`

We will have a convention such that event is any thing that start with `on`(eg: onClick), otherwise it's a html attribute.

```js
let createInstance = (type, props) => {
  let isAttribute = attrName => attrName != 'children' && !isEvent(attrName);
  let isEvent = attrName => attrName.startsWith('on');
  let eventName = event => event.substring(3).toLowerCase();

  if (type == 'TEXT_NODE') {
    return document.createTextNode(props.value);
  }
  let node = document.createElement();

  props.forEach(key => {
    if (isEvent(key))
      node.addEventListener(eventName(event), props[event])
    else if (isAttribute(key))
      node.setAttribute(attrName, props[attrName])
  })

  // loop through children and recursivelly render them
  let children = props.children || [];
  children.forEach(child => {
    let childNode = render(child, node);
    // then append to it's parent
    node.appendChild(childNode);
  })
  return node;
}
```
