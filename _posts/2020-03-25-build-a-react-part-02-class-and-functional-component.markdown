---
layout: post
title: "Build your own React, part 2: Class and Functional Component"
date: 2020-03-25 00:16:00
summary: In this next post of the series, let's implement the usual class and functional component.
description: In this next post of the series, let's implement the usual class and functional component.
categories: javascript
---

# Functional component

Functional component is very simple. It's a function that received a props variable and return a React element.
Therefore, in our `createInstance` function, we just need to add another condition to check if the type is a function or not. 
If it is, we will call this function.

# Class component

If you have used React, you would be familiar with class component. Its usage can be like

```js
class Form extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    return <div><label><input type="checkbox" name="selection"/>Check</label></div>
  }
}
```

so in my own React library, I also need to implement Component so that it can be extended.

```
let React = (function(){
  class Component {
    this.props = props;
    this.state = {};
  }

  return { render, createElement, Component }
})()
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

```
let createInstance = (type, props) => {
  // omitted
  if (typeof type == 'object') {
    if (isReactClass(type)) {
    } else {
    }
  }
}
```
