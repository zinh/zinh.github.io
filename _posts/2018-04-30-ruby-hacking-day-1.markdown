---
layout: post
title: "Ruby hacking day 1"
date: 2018-04-29 15:16:00
summary: From this week, I will try to hack into Ruby core, I will write blog posts along
description: From this week, I will try to hack into Ruby core, I will write blog posts along
categories: ruby
---

I've been wanting to take a look at Ruby's core for sometime, although I've read Ruby Under a Microscope but haven't got my hand dirty with the code. I will try do do some coding with Ruby's source from this week and write some posts along.

This week, I want to setup development enviroment, I will test on both Mac and Linux(Ubuntu) to see if there is any difference.

## Compile ruby from source

First, pull the source from github(I will use 2.5.1 version)

~~~~ bash
mkdir workspace
cd workspace
git clone --depth 1 --branch v2_5_1 git@github.com:ruby/ruby.git ruby_source
cd ruby_source
~~~~

We will need `autoconf` to compile ruby from source.

~~~ bash
brew install autoconf openssl readline
~~~

then run `autoconf` inside `ruby_source` directory

~~~ bash
autoconf
mkdir build
cd build
../configure --prefix=$PWD/install
             --enable-shared 
             --with-openssl-dir="$(brew --prefix openssl)" 
             --with-readline-dir="$(brew --prefix readline)" 
             --disable-libedit
make
make install
~~~

On Ubuntu, we will need to install these libraries

~~~ bash
apt-get install -y build-essentials libssl-dev libreadline-dev zlib1g-dev bison ruby
~~~

Funny thing is we will need a working Ruby in order to compile Ruby from source; therefore, the command above also installs ruby from apt. After that, we compile and install same as on Mac.

If there is no problem, we will have ruby binary installed to `workspace/ruby/build/install` directory.

## Miniruby
During compilation process, there is a mini version of Ruby called `miniruby`, this one will be use to compile the full version of Ruby. Because it's a minified version, compiling of `miniruby` is much faster than the full version. We can use it to test our changes in Ruby's source and have a faster feedback. In fact, Ruby the command `make run` is use for this purpose.

In order to invoke make run we need to create a `test.rb` file in ruby source folder, for example

~~~
cd ruby_source
echo "puts 'hello world'" > test.rb
cd build
make run
~~~

Another useful command is `make runruby`, this one also run `test.rb` but with full version of ruby.

So the workflow when making change Ruby would be like

1. Making some changes
2. Wring some code to test new feature in `test.rb`
3. Running it with `make run`

## Debugging using gdb(Linux only)

One of the important thing when working with C code is debugging(or any other language for that matter), on Linux it would be __gdb__.
To debug using gdb we can use `make gdb`. This will invoke miniruby, run `test.rb` and exit(if there is no error). So for example

~~~
echo "put 'Hello world'" > test.rb
cd build
make gdb
~~~

## Debugging using lldb(Mac)

It is very troublesome to setup `gdb` on Mac, we can use `lldb` which is provided defaultly instead. We can use the command `make lldb` to invoke lldb debugger during execution of miniruby or full-ruby. It will stop right before execution of the script, we can inspect code, set breakpoint from there.

~~~
echo "put 'Hello world'" > test.rb
cd build
make lldb
~~~

Some useful command with `lldb`

~~~
b <method> # set breakpoint at a method
b rb_f_puts # set breakpoint at method rb_f_puts(C implementation of `puts` method in Ruby)
~~~
