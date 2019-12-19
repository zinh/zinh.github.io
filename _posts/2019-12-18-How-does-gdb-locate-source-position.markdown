---
layout: post
title: "How does GDB locate source code"
date: 2019-12-18 00:00:01
summary: My attempt to explain how does GDB(or other debugger) be able to locate source location.
description: how does debugger be able to locate source location from an executable
categories: programming
---

I always wonder how can GDB locate the instruction during execution of an instruction. 
Turn out, this information is embebed inside the executable, GDB just need to parse and search for this information.

Let's say we have a simple C program as such:

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

Normally, compile with gcc give no special information inside the executable. We can check it by the command:

~~~
# Compile to object file
gcc -c fizz.c

# List sections in this object file
objdump -h fizz.o
~~~

The sections looks like this

~~~
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
~~~

Just normal `.text` and `.data` sections

With this kind of output, debugger won't be able to locate the position in source file.

We need to set the debug flag to attach this information to object file.

~~~
gcc -gstabs -c fizz.c
~~~

Now this time, there are debug sections in the result object file(.stab and .stabstr):

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
