
'use strict';
let React = (function() {
  let createElement = (type, options, ...children) => {
    return {
      type,
      props: Object.assign(
        {
          children: children.map(child =>
            typeof child == "object"
            ? child
            : { type: "TEXT_NODE", props: { value: child } }
          )
        },
        options
      )
    };
  };

  let isAttribute = attrName => attrName != "children" && !isEvent(attrName);
  let isEvent = attrName => attrName.startsWith("on");
  let eventName = event => event.substring(2).toLowerCase();

  let createInstance = (type, props) => {
    if (type == "TEXT_NODE") {
      return document.createTextNode(props.value);
    }

    if (typeof type == 'function') {
      let instance = new type(props);
      let childElement = instance.render();
      let childNode = createInstance(childElement.type, childElement.props);
      instance.dom = childNode;
      return childNode;
    } 

    let node = document.createElement(type);


    for (let key in props) {
      if (isEvent(key)) 
        node.addEventListener(eventName(key), props[key]);
      else if (isAttribute(key)) 
        node.setAttribute(key, props[key]);
    }

    // loop through children and recursivelly render them
    let children = props.children || [];
    children.forEach(child => {
      let childNode = createInstance(child.type, child.props);
      // then append to it's parent
      node.appendChild(childNode);
    });
    return node;
  };

  let updateInstance = (dom, currentElement, nextElement) {
    if (typeof nextElement.type == 'string') {
    }
  }

  let render = (element, parentNode) => {
    let node = createInstance(element.type, element.props);
    parentNode.appendChild(node);
  };

  class Component {
    constructor(props) {
      this.props = props;
      this.state = {};
    }

    setState(partialState) {
      this.state = Object.assign({}, this.state, partialState);
      const element = this.render();
      const node = createInstance(element.type, element.props);
      const parent = this.dom.parentNode;
      parent.replaceChild(node, this.dom)
      this.dom = node;
    }
  }

  return { createElement, render, Component };
})();
