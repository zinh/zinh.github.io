---
layout: post
title: "Basic usage of libuv"
date: 2020-05-11 00:16:00
summary: This post server as my note whilte fiddling with libuv, I will write some basic program using libuv.
description: libuv is the one taking care of event-loop in nodejs. It is what make nodejs so good at IO operations while still running under a single thread. I will explain some basic usage of libuv in this post
categories: javascript
---

## libuv and its relation with nodejs

Event loop is a concept of Javascript. Every Javascript implementation need to implement an eventloop.
V8 has a default eventloop that can be overrided or extended.
NodeJS override this event loop by using libuv.
Libuv is implemented in C so in order to use it one need to have some knowledge of C, or use other's language binding.

This post assumes that we've already had libuv compiled and installed somewhere in our library load path.

## Programming model of livuv

1. Initialize the event loop
2. Create event handler
3. Run event loop

## Initiate event loop 

The center part of the event loop's initialization is `uv_loop_t` and `uv_loop_init`.

> uv_loop_init signature:
>
> int uv_loop_init(uv_loop_t\* loop)

Each event loop has its own data structure called `uv_loop_t`.
To init a loop, we use `uv_loop_init`.

So our code could be like:

```c
#include <uv.h>

int main() {
  uv_loop_t loop;
  uv_loop_init(&loop);
}
```

You may notice that all libuv public function and data structure have `uv_` as its prefix.

## Create event handler

libuv support various type of IO events, including:

- File IO operations such as open/read/write files
- Networking operations such as socket(TCP, UDP)

File operation is just the same as normal synchronous version of libc.
We have 3 main functions for file operations:

`uv_fs_open`

This function is use to open a file, its signature:

```
int uv_fs_open(uv_loop_t* loop, 
               uv_fs_t* req, 
               const char* path, 
               int flags, 
               int mode, 
               uv_fs_cb cb)
```

- `loop` is the one we've created at step 1.
- `req`: everytime we create an event handler, we need to create its coresponding request. The request depends on IO operation.
In file IO, request's type is `uv_fs_t`. We will need to create and initialize this variable before passing it to `uv_fs_open`
- path, flags, mode is the same as [open(2)](http://man7.org/linux/man-pages/man2/open.2.html)
- that last parameter is our callback function.

```
int uv_fs_read(uv_loop_t* loop, 
               uv_fs_t* req, 
               uv_file file, 
               const uv_buf_t bufs[], 
               unsigned int nbufs, 
               int64_t offset, 
               uv_fs_cb cb)`
```

```
int uv_fs_write(uv_loop_t* loop, 
                uv_fs_t* req, 
                uv_file file, 
                const uv_buf_t bufs[], 
                unsigned int nbufs, 
                int64_t offset, 
                uv_fs_cb cb)`
```

## Run event loop

## References

[libuv documentation](http://docs.libuv.org/en/v1.x/)

[Javascript's event loop model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
