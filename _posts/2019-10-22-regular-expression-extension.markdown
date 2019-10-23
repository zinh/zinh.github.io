---
layout: post
title: "Regular expression look-ahead and look-behind"
date: 2019-10-22 15:16:00
summary: About look-ahead and look-behind with regular extension
description: Explanation about two extensions of regular expression, look-ahead and look-behind along with example.
categories: misc
---

My knowledge of regular expression usually contains just some simple syntax such as `+`, `*`, `[]`, `{}`, `()`.
However, there are lots of extension to the original regular extension which is based on deterministic finite automata i.e these extension are not actually regular language but programming language's add-on to regular extension; therefore, supporting these extensions and syntex depend on programming language. 
They provide more power to regular extension but using them without caution may lead to performance issue.

The syntax for these extension usually start with `(?` eg: look-ahead syntax will be `(?=<pattern>)` and look-behind `(?<=<pattern>)`.

These two extensions are widely support by programming languages such as perl, ruby, python, nodejs.

As the name implies, look-ahead will match ahead to the current matching position without consuming it. 
For example, with this simple regex: `a(?=b)` we will match an `a` only if it is followed by an `b`.

Similarly, look-behind will match only if it is preceeded by a pattern without consuming it. 
For example, `a(?<=b)` will match an `a` only if it is preceeded by an `b`

Now we will take a look at more complex example of look-ahead and look-behind.
