---
layout: post
title: "How does debugger locate source code of an executable"
date: 2019-12-18 00:00:01
summary: My attempt to explain how a debugger can locate source information of an executable.
description: how does debugger(such as gdb, lldb) be able to locate source location from an executable
categories: programming
---

I always wonder how can debugger tools such as GDB would be able to locate the source code of an instruction. 
Turn out, this information is embebeded inside the executable, GDB just need to parse and search for this information.

So let's say we have a simple C program as such:

~~~c
// fizzbuzz.c
#include <stdio.h>
int main(){
  for (int i = 0; i < 100; i++)
    if (i % 15 == 0)
      printf("FizzBuzz\n");
    else if (i % 3 == 0)
      printf("Fizz\n");
    else if (i % 5 == 0)
      printf("Buzz\n");
    else
      printf("%d\n", i);
}
~~~

Normally, compiling with gcc gives no special information inside the executable. We can check it by using `objdump`

~~~
# Compile to object file
gcc -c fizz.c

# List sections in this object file
objdump -h fizz.o
~~~

The output looks like:

```
Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .text         000000fb  0000000000000000  0000000000000000  00000040  2**0
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
  1 .data         00000000  0000000000000000  0000000000000000  0000013b  2**0
                  CONTENTS, ALLOC, LOAD, DATA
  2 .bss          00000000  0000000000000000  0000000000000000  0000013b  2**0
                  ALLOC
  3 .rodata       00000017  0000000000000000  0000000000000000  0000013b  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  4 .comment      0000002c  0000000000000000  0000000000000000  00000152  2**0
                  CONTENTS, READONLY
  5 .note.GNU-stack 00000000  0000000000000000  0000000000000000  0000017e  2**0
                  CONTENTS, READONLY
  6 .eh_frame     00000038  0000000000000000  0000000000000000  00000180  2**3
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA
```

Just normal `.text` and `.data` sections

With this kind of output, debugger won't be able to locate any information about the source code of an instruction.

We need to set the debug flag to attach this information to object file.

~~~
gcc -gstabs -c fizz.c
~~~

Here we set the debug symbol using a STABS format albeit rather old(there is another format called DWARF, but let's save it for another post).

Now this time, there are debug sections in the result object file(`.stab` and `.stabstr`):

~~~
Sections:
Idx Name          Size      VMA               LMA               File off  Algn
... 
  3 .stab         0000069c  0000000000000000  0000000000000000  0000013c  2**2
                  CONTENTS, RELOC, READONLY, DEBUGGING
  4 .stabstr      0000110a  0000000000000000  0000000000000000  000007d8  2**0
                  CONTENTS, READONLY, DEBUGGING
...
~~~

Let's have a quick review on STABS format.

## The Stabs format

We can check the STABS format that gcc emits by using `-S` flags

~~~
gcc -S -gstabs fizz.c
~~~

this will create an `fizz.s` in compiled assembly syntax. There we can see the following information

``` asm
# extract from fizz.s
.stabs  "fizz.c",100,0,2,.Ltext0
.stabs  "main:F(0,1)",36,0,0,main
.stabn  68,0,2,.LM0-.LFBB1
```

according to [STABS documentation](https://sourceware.org/gdb/onlinedocs/stabs.html#Stabs-Format){:target="_blank"}{:rel="nofollow"}, there are 4 kinds of stab record where `stabs` and `stabn` are the most used.
Their format are as follow:

~~~
.stabs "string",type,other,desc,value
.stabn type,other,desc,value
~~~

### stabs

Take `.stabs  "fizz.c",100,0,2,.Ltext0` for example, we know that this is a `stabs` kind, with the `string = "fizz.c"`, `type` is 100. In order to know that 100 means, we have to check the reference code [stab type code](http://www.math.utah.edu/docs/info/stabs_12.html#SEC64){:target="_blank"}{:rel="nofollow"}

over there, we will know that it's a `N_SO` type, i.e:

> Path and name of source file containing main routine

the `other` field is 0 so it just means NULL, `desc` is 2 meaning the source code is written in K&R traditionally C(this field is optional). Finally, `value` is `.Ltext0` meaning the address of this file when it runs.

Now let check another one, `.stabs  "main:F(0,1)",36,0,0,main`

- string = "main:F(0, 1)", `F` means it's a global function, 1 is the return type(int).
- type = 26, meaning a `N_FUN`
> Function name or text segment variable for C
- value = main ie: address of this function when running

### stabn

Let check the next `stabn`

> .stabn  68,0,2,.LM0-.LFBB1

Remember the syntax of stabn is `.stabn type,other,desc,value`, we can deduce the following information:
- type = 68(`N_SLINE`)
> Line number in text segment
- desc = 2, line 2 of source file
- value = `.LM0-.LFBB1`, the address in memory when it is run(note that this address will turn into a memory address when it is executed)

When generating assembly code, these stab information is intermingled between asm instructions. But when assembler compiles into machine code(or object file), all stab information will be put into 2 sections: `stabs` and `stabstr` and by parsing these section, debugger can trace back to the source information.

We can also list all of the exported stab symbols of the executable by using `objdump`

~~~
objdump -G fizz
~~~

So giving an instruction's address in memory(for example, a value of IP register), we can deduce the source's information by the following 3 steps:

1. locate the source file(using `N_SO` type)
2. locate the method inside this source file(using `N_FUN` type)
3. location the line number inside this method(using `N_SLINE` type)

In my next post, I will use these 3 steps to write a program that can print its own source information.
