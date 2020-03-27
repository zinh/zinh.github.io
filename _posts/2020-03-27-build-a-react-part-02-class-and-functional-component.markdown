---
layout: post
title: "Build your own React, part 2: Class and Functional Component"
date: 2020-03-27 00:16:00
summary: In this next post of the series, let's implement the usual class and functional component.
description: In this next post of the series, let's implement the usual class and functional component.
categories: javascript
---

__Index:__

[__1.__ Part 1: DOM generator](/javascript/2020/03/25/build-a-react-part-01-dom-creation.html)

__2.__ Part 2: Class and Functional Component

In this second part of the series, I will add support for Class and Functional Component. We will start with the simpler one:

# Functional component

Functional component in React is very simple. It's a function that received a `props` variable and return a React element, it has no state.
Therefore, in our `createInstance` function, we just need to add another condition to check if the type is a function or not. 
If it is, we will call it.

```js
let createInstance = (type, props) => {
  // ... (omitted)
  if (typeof type == 'function') {
    let chilElement = type(props);
    return createInstance(chilElement.type, chilElement.props);
  }
  // ... (omitted)
}
```

this enables us to write code like this


```js
let Form = (props) => {
  return <div><label><input name="answer" type="checkbox"/></label></div>;
}
```

next, let's implement Class Component, a slightly more complicated type.

# Class component

If you have used React, you would be familiar with class component. Its usage can be like

```js
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render(){
    return <div><label><input type="checkbox" name="selection"/>Check</label></div>;
  }
}
```

so in my own React library, I also need to implement a Component class so that it can be inherited.

```js
let React = (function(){
  class Component {
    constructor(props) {
      this.props = props;
      this.state = {};
    }
  }

  return { render, createElement, Component }
})();
```

then in our `createInstance`, we just need to add another condition to check if it's a Class Component.

However,

we cannot use the usual `typeof` to check because class and function both have the same type, which is `function`.

So, to differ between these two component, we will set a variable of React.Component something like:


```js
Component.prototype.isReactComponent = true;

// Helper function to check for React Class
let isReactClass = (type) => type.prototype && type.prototype.isReactComponent;
```

Simple as that, we add another condition in our `createInstance`

```js
let createInstance = (type, props) => {
  // omitted
  if (typeof type == 'object') {
    if (isReactClass(type)) {
      let instance = new type(props);
      let childElement = instance.render();
      let childNode = createInstance(childElement.type, childElement.props);
      instance.dom = childNode; // explanation below
      return childNode;
    } else { // functional component
      // ... omitted
    }
  }
}
```

# Re-render when state change

One missing piece of class component is state and re-render after a state change.
Let's add `setState` function.

```js
class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  setState(partialState) {
    // we don't want to mutate current state, 
    // so create a new state and assign it to this.state
    this.state = Object.assign({}, this.state, partialState);

    // re-render
    const element = this.render();
    const node = createInstance(element.type, element.props);
    const parent = this.dom.parentNode; // this.dom is the one assigned in createInstance
    parent.replaceChild(node, this.dom)
    this.dom = node;
  }
}
```

Our re-render mechanism is very simple, we call `createInstance` to create a new DOM then use `replaceChild` to replace it to the old one. We also need to keep track of the DOM node that was rendered; hence, the assignment `this.dom = node`.

So, our React works but not quite performant because it will create a new DOM everytime we change state. In reality, we need another step to decide which will DOM we can reused and which needed to create given current props and new props. This step is called _reconciliation_ and is what will be implemented in my next post.

Anyway, the full code of this part is at [codepen](https://codepen.io/harue/pen/eYNQvoV){:rel="nofollow"}
