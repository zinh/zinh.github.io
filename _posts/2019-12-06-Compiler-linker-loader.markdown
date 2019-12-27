---
layout: post
title: "Compiler, linker and loader in Linux"
date: 2019-12-06 00:00:01
summary: my explanation of gcc(or clang) compiler, linker and loader, their relationship.
description: 
categories: programming
---

Let's have a simple program in C such as:

~~~ c
// main.c
#include <stdio.h>
int main() {
  printf("Hello, world!");
  return 0;
}
~~~

which print the string `"Hello, world!"` to stdout and exit.;

We compile it using gcc and get an executable.

~~~
gcc main.c -o main
~~~

now, there are lots of thing happen while running this command,

First, a preprocessor will preprocess this c source to expand any `#include`, `#define` statemenets. Its result is just another C source.
After that, the compiler will convert this c source into assembly.

We can single out this step by using the argument:

~~~
gcc -S main.c
~~~

which will emit a `main.S` assembly source code.

Then we will need an assembler to actually convert this `.S` file into machine code(i.e binary format)

this step can be run by passing `-c` option to gcc

~~~
gcc -c main.s
~~~

or we can use another tool call GNU Assembler(as), one of the two main tools of GNU's binutilities. The other one is `ld` which is used in liking step.

TODO: fix parameter of as
~~~
as main.s
~~~

The result of assembler step is an object file that is readly to be linked into an executable.

Scanning the assembly source code, we see it defines various sections(eg: .text, .data, ...). These sections vary depends on the target architecture and executable format but let's just stick to Linux and it's default ELF format.

In ELF format, assembly code is devided into 3 main sections
- `.text`: contain the code that actually will be run on CPU
- `.data`: contain constant value, initialized variables.
- `.bss`: contains uninitialize variables.

Actually, ELF allows abitrary kinds of sections but the aforementioned are the main one.

If we have only one source and it doesn't use any other library(which usually not the case), the compilation chain can just convert this `.o` file into `ELF` format.
But if there a many source file and we need to assemble these source file into one, or that we call functions defined in other library, that's the job of linker(the `ld` command).

The linker will read each of its input's sections, merged and relocated them into approriated position in the executable.

In our `main.c`, we used the function `printf` which is a function of C standard library. GNU libc(glibc), llvm-libc, musl-libc are well-known implementations of C standard library. On a typical x86_64 Linux system, glibc is usually put inside the folder `/lib/x86_64-linux-gnu/libc.so.6`.

As a result, when linker assembles our object file into ELF format, it also needs to embebded the information of `printf` so that when it is executed, the loader will know where to find this `printf`.

This concludes out linker step. Finally, when executing the ELF file, we will need another program call loader.

If our program don't include any outside function or on the linker step, we instruct ld to create a static link binary, we won't need this loader.
But usually, executable is compiled to dynamic binary, ie it will call the function defined in another library. Dynamic linking is the recommended way to create binary because it create a smaller binary, easier for us to update a specific library without the need of recompile all of our executables.

In Linux, we use the loader call `ld.so` or `ld-linux.so*`, this loader is embebded in our ELF file and is executed foremost even before our `main` is execute. When being executed, loader will try to locate our dynamic linking function(eg: `printf` in our example), find the location of libc.so, location of `printf` inside libc.so then load this function into our program's address space ready to be called.

More information can be found on man page of ld.so(8)

This digram summarize all of the steps:

![Compiler linker loader](https://user-images.githubusercontent.com/5134525/71498531-10cd7480-28a0-11ea-83b1-e61bb6861bdb.png)
