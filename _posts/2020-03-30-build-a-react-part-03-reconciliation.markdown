---
layout: post
title: "Build your own React, part 3: Reconcilition"
date: 2020-03-27 00:16:00
summary: In this third part of the series, we will implement one of the interesting part which is reconciliation.
description: In this third part of the series, we will implement one of the interesting part which is reconciliation.
categories: javascript
---

__Index:__

[__1.__ Part 1: DOM generator](/javascript/2020/03/25/build-a-react-part-01-dom-creation.html)

[__2.__ Part 2: Class and Functional Component](/javascript/2020/03/27/build-a-react-part-02-class-and-functional-component.html)

__3.__ Part 3: Reconcilition

In previous post, we have implement Class Component and the `setState` function. Right now, everytime there is a change in state, we will create a new DOM tree and replace it to the old one. The creation of DOM tree is a very expensive task. An application can render hundreds of DOM nodes so to re-create them from scratch is an uneffective operation.

Our goal is to reuse DOM node as much as posible. For example, changing from a `<input value="1" type="text />` to `<input value="2" type="text"/>` doesn't need to create a new DOM, we just reuse the old one and update the value attribute from 1 to 2. So given a React element, its DOM and the new React Element, we need to decide an effective way to go from old DOM tree to new one, this is the task of *reconciliation*.

The first thing we need to do is save the current rendered DOM, its React Element to a variable. Let's call it `currentRoot`.

```js
let currentRoot = null;

let render = (element, parentNode) => {
  if (currentRoot) {
  } else {
    let node = createInstance(element.type, element.props);
    currentRoot = {node, element};
    parentNode.appendChild(node);
  }
}
```

The concept of maintaining a version of React Element in memory is the so-called Virtual DOM.
