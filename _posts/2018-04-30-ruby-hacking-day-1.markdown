---
layout: post
title: "Ruby hacking week 1"
date: 2018-04-29 15:16:00
summary: From this week, I will try to hack into Ruby core, I will write blog posts along
description: From this week, I will try to hack into Ruby core, I will write blog posts along
categories: ruby
---

I've been planning to take a look at Ruby's source code for sometime; although I've read Ruby Under a Microscope but haven't got my hand dirty with the code. I will try do do some coding with Ruby's source from this week and write some posts along.

This week goal is to setup environment to compile from source.

## Compile ruby from source

First, pull the source from github(I will use `2.5.1` version)

~~~~ bash
mkdir workspace
cd workspace
git clone --depth 1 --branch v2_5_1 git@github.com:ruby/ruby.git ruby_source
~~~~

On Mac, we will need `autoconf`, `openssl` and `readline` to compile ruby from source. Install them with homebrew:

~~~
brew install autoconf openssl readline
~~~

then run `autoconf` inside `ruby_source` directory

~~~
cd ruby_source
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

On Ubuntu, we will need to the following libraries in order to compile Ruby

~~~
apt-get install -y build-essentials libssl-dev libreadline-dev zlib1g-dev bison ruby
~~~

Funny thing is we will also need a working Ruby in order to compile Ruby from source. After that, we compile and install same as on Mac.

~~~
cd ruby_source
autoconf
mkdir build
cd build
../configure --prefix=$PWD/install --enable-shared 
make
make install
~~~

If there is no problem, we will have ruby binary installed to `workspace/ruby/build/install` directory.

## Miniruby
During compilation process, there is a mini version of Ruby called `miniruby`, this one will be use to compile the full version of Ruby. Because it's a minified version, compiling `miniruby` is much faster than the full version. We can use it to test our changes in Ruby's source and have a faster feedback. In fact, Ruby the command `make run` is used for this purpose.

In order to invoke make run we need to create a `test.rb` file in ruby source folder, for example:

~~~
cd ruby_source
echo "puts 'hello world'" > test.rb
cd build
make run
~~~

Another useful command is `make runruby`, this one will invoke the full version of Ruby to run `test.rb`

So the workflow when making change Ruby would be like

1. Making some changes
2. Wring some codes to test new feature in `test.rb`
3. Running it with `make run` or `make runruby`

Next, we will setup debugging tool. This is where Mac and Linux diverses. On Linux, we will use GNU gdb and on Mac we will use `lldb`. Although I am more familar with gdb, I haven't found a way to setup gdb on Mac so I've used lldb on Mac.

## Debugging using gdb(Linux only)

We will need to install gdb.

```
apt install -y gdb
```

To invoke gdb during execution of miniruby, or ruby, we will use the command `make gdb`(inside `build` folder)

## Debugging using lldb(Mac)

lldb is installed defaultly so there no need to install it.
