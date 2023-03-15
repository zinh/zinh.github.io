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

The center part of event loop's initialization is `uv_loop_t` struct and `uv_loop_init` function.

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

- File IO operations such as open/read/write file, pipe,...
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
- that last parameter is our callback function. It needs to have a signature of `void callback(uv_fs_t* req)`

So to open a file, we'll use it as:

```c
void open_cb(uv_fs_t *req) {
  // a do nothing callback
}

uv_fs_t req = malloc(sizeof(uv_fs_t));
uv_fs_open(loop, req, filepath, O_RDONLY, NULL, open_cb);
```

The `open_cb` is our callback function which will be called after file-open operation finished. File descriptor will pass to req->result.

Notice that until we start the event loop, no operation will be run yet.

After open a file, we can read and write to it using `uv_fs_read` and `uv_fs_write`. Their signature are as follow:

```c
int uv_fs_read(uv_loop_t* loop, 
               uv_fs_t* req, 
               uv_file file, 
               const uv_buf_t bufs[], 
               unsigned int nbufs, 
               int64_t offset, 
               uv_fs_cb cb)`
```

```c
int uv_fs_write(uv_loop_t* loop, 
                uv_fs_t* req, 
                uv_file file, 
                const uv_buf_t bufs[], 
                unsigned int nbufs, 
                int64_t offset, 
                uv_fs_cb cb)`
```

Now let add a file-read operation. It will need to implemented inside our `open_cb`.

```c
void open_cb(uv_fs_t *req) {
  // req->result is file descriptor
  iov = uv_buf_init(buffer, sizeof(buffer));
  uv_fs_t read_request = malloc(sizeof(uv_fs_t));
  uv_fs_read(uv_default_loop(), &read_req, req->result,
    &iov, 1, -1, read_cb);
}
```
## Run event loop

## References

[libuv documentation](http://docs.libuv.org/en/v1.x/)

[Javascript's event loop model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
