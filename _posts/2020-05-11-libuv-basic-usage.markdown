---
layout: post
title: "Basic usage of libuv"
date: 2020-05-11 00:16:00
summary: This post server as my note while fiddling with libuv, I will write some basic program using libuv.
description: libuv is the one taking care of event-loop in nodejs. It is what make nodejs so good at IO operations while still running under a single thread. I will explain some basic usage of libuv in this post
categories: javascript
---

## libuv and its relation with nodejs

Event loop is a concept of Javascript. Every Javascript implementation need to implement an event loop.
V8 has a default event loop that can be replaced or extended.
NodeJS uses libuv for its event loop implementation.

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

```c
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

uv_fs_t open_req;
uv_loop_t loop;
int main(){
  uv_loop_init(&loop);
  uv_fs_open(&loop, &open_req, filepath, O_RDONLY, NULL, open_cb);
}
```

The `open_cb` is our callback function which will be called after file-open operation finished. File descriptor will pass to `req->result`.

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

- `loop`, `cb` and `req` is the same as `uv_fs_open`
- `file` is the file descriptor(result of open request, `open_req.result`)
- `bufs` is an array of `uv_buf_t` each element represents a buffer that we'll read from/write to. This allows us to read/write into multiple buffers at the same time.
- `nbufs` is length of bufs
- `offset` is the position to read from/write to. -1 for current file pointer.

Now let add a file-read operation. It will happen inside our `open_cb`.

```c
char buffer[1024];

void open_cb(uv_fs_t *req) {
  // req->result is file descriptor
  iov = uv_buf_init(buffer, sizeof(buffer));
  uv_fs_t read_req;
  uv_fs_read(uv_default_loop(), &read_req, open_req.result,
    &iov, 1, -1, read_cb);
}

void read_cb(uv_fs_t *req) {
  // req->result is number of character read
  // let just write it back to stdout
  if (req->result > 0) {
    printf("%.*s", req->result, buffer);
    // continue reading till EOF
    iov = uv_buf_init(buffer, sizeof(buffer));
    uv_fs_t read_req;
    uv_fs_read(uv_default_loop(), &read_req, open_req.result,
      &iov, 1, -1, read_cb);
  } else if (req->result == 0) {
    // we've reached EOF
  }
}
```
## Run event loop

To start event loop, we'll use `uv_run`

```c
uv_run(loop, UV_RUN_DEFAULT);
uv_loop_close(loop); // also clean up after event loop return
```

## References

[libuv documentation](http://docs.libuv.org/en/v1.x/)

[Javascript's event loop model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
