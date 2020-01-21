---
layout: post
title: "Event driven non blocking IO with Ruby's fiber"
date: 2019-08-16 15:16:00
summary: How can we implement reactor using Ruby's fiber
description: Fiber is with Ruby since version 1.9. However recently has been resurface due to actively work on improving Ruby's concurrency performance. In this blog post, we will get some basic use of Fiber and try to implementing an Reactor server using Fiber.
categories: ruby
---

Fiber is with Ruby since version 1.9. However recently it has been resurfaced due to active work on improving Ruby's concurrency performance. In this blog post, I will explain some basic usage with Fiber.

To put is simply, Fiber is just a function that can be stop and resume. To understand how it is of any use to stop and resume a function at will, let's compare it with the tradionally sequential execution model.

~~~rb
# sequencial.rb
def foo
  puts "foo 1"
  puts "foo 2"
end

def bar
  puts "bar 1"
  puts "bar 2"
end

foo
bar
~~~

the order of execution is that `foo` has to be finished before `bar`, `bar` cannot start as long as foo is still running. As a result, it will output:

~~~
foo 1
foo 2
bar 1
bar 2
~~~

So, with this model, how can we let `foo` and `bar` run simultaneously?

It's easy, we can just put each of them in their own thread(though MRI Ruby's GIL will prevent `foo` and `bar` running in parallel, let's just assume that they are executed concurrently, or alternatively using JRuby).

~~~ rb
# thread.rb
t1 = Thread.new do
  foo
end

t2 = Thread.new do
  bar
end
t1.join
t2.join
~~~

We can see the output interleaves between foo and bar.

~~~
bar 1
foo 1
bar 2
foo 2
~~~

By spawning a new thread for each function, we let the OS(or in our case, ruby VM) decides when and how to execute foo and bar simultaneously.
This model is known as *Preemptive Multitasking*.

There is another model called *Cooperative Multitasking*(or *non-preemptive multitasking*). Its idea is that OS/VM will not schedule our function for us, it's our responsibilty to start, stop and resume our function in order to achieve concurrency. And Ruby's Fiber provides us some primitives to let us schedule tasks by ourself.

Let's have some example.

### Fiber basic

To define a fiber, we use `Fiber.new`

~~~rb
# fiber.rb
foo = Fiber.new
  puts "foo 1"
  Fiber.yield
  puts "foo 2"
end

bar = Fiber.new
  puts "bar 1"
  Fiber.yield
  puts "bar 2"
end
~~~

When running fiber.rb, nothing happens as we haven't started our fiber yet. We use `Fiber#resume` to start a fiber

~~~rb
foo.resume
bar.resume
~~~

We will get the following output

~~~
foo 1
bar 1
~~~

In our example, we have used `Fiber.yield`, it means halt the current fiber and return control to it's parent.
So in our first `foo.resume`, it means that we want to run `foo` until the first `yield` point, then stop it.
After that, running `bar` until its first `yield` point then stop it.
This explains our output.

Next, we can let `bar` continue its running before switching to `foo`

~~~rb
foo.resume # output: foo 1
bar.resume # output: bar 1
bar.resume # output: bar 2
foo.resume # output: foo 2
~~~

As we can see, the effect looks just like multi-threading, output is altenated between foo and bar.

Next, let see how can we passing message between fibers.

## Passing messages between fibers

~~~rb
foo = Fiber.new do |a|
        b = a * Fiber.yield("hello")
        return b
      end
value1 = foo.resume(6) # inside fiber: a = 6; value1 = hello
value2 = foo.resume(7) # inside fiber: Fiber.yield return 7; val2 = 42
~~~

__Passing value from caller to fiber__

To pass values to a fiber, we pass them as parameters of `Fiber#resume`.

In our first call to `foo.resume(6)`, 6 is pass to foo as its initial parameter(ie `a`).

In our second call to `foo.resume(7)`, inside Fiber, 7 is the return value from `Fiber.yield`, therefore, `b = 6 * 7`

__Passing value from fiber to its caller__

To pass a value from fiber to its caller, we pass it as parameter of `Fiber.yield`.

In our first call to Fiber.yield, we return the string "hello" to fiber's caller so value1 = "hello".

In our second call to resume, b value is returned so value2 = 42

## Application of Fiber: combination with EventMachine

Combine Fiber with EventMachine give us another way to structure our program more intuitively.
Here is one simple example:

~~~rb
require 'fiber'
require 'em-http-request'

def async_get(url)
  f = Fiber.current
  http = EM::HttpRequest.new(url).get
  http.errback { f.resume("error") }
  http.callback { f.resume(http.response) }
  return Fiber.yield
end

EM.run do
  Fiber.new do
    response = async_get("https://www.google.com")
    puts response
    EM.stop
  end.resume
end
~~~

`async_get` has wrap EventMachine callback mechanism inside a fiber, it let our code looks like it is executed sequencally. This usage somewhat reflects *async, await* mechanism of Javascript.

In my code, I have used `Fiber.current` which will return the current fiber and this function defined in `fiber` library hence `require 'fiber'` is needed.

## Application of Fiber: non-blocking IO

With the support of Fiber, we can implement non-blocking IO quite easily. Let's make an echo server with Fiber.

The idea is that we will maintain a Hash of fiber, each correspond to a TCP connection.

~~~rb
class Reactor
  def initialize
    @readable = {}
    @writeable = {}
  end
end
~~~

In the event-loop, we check if there is any TCP connection available by using `IO.select`(which is a blocking call) then just resume the corresponding fiber of that connection.

~~~rb
class Reactor
  # ...

  def run
    while @readable.any? || @writeable.any? 
      readable, writeable = IO.select(@readable, @writeable)
      readable.each{ |io| @readable[io].resume }
      writeable.each{ |io| @writeable[io].resume }
    end
  end
end
~~~

Here, we will define another 2 methods to append to `@readable` and `@writeable`, after that, 
halt the Fiber and wait until it is invoked by our event-loop.

~~~rb
class Reactor
  # ...
  def await_readable(io)
    @readable[io] = Fiber.current
    Fiber.yield
    @readable.delete(io)
  end

  def await_writeable(io)
    @writeable[io] = Fiber.current
    Fiber.yield
    @writeable.delete(io)
  end
end
~~~

Now to our main program, we will first initialize our object

~~~rb
reactor = Reactor.new
server = TCPServer.new('localhost', 8080)
~~~

then create a Fiber for `server` and a new Fiber for each connection

~~~rb
Fiber.new do
  # wait for connection, meanwhile, halt this Fiber
  reactor.await_readable(server) 
  client = server.accept
  Fiber.new do
    # wait for this socket to be readable, meanwhile, halt it
    reactor.await_readable(client) 
    request = client.gets

    # wait for this socket to be writeable, meanwhile, halt it
    client.await_writeable(client) 

    # just send back the request then close
    client.puts(request) 
    client.close
  end
end.resume

reactor.run
~~~

We can see that our program would be able to handle concurrency connection without needing of threading or multi-process.

Once again, our `await_readable` `await_writeable` mimick `async/await` mechanism of ES6.

## Remark

Fiber is not a concept exclusively to Ruby, many other programming languages have their own non-preemptive multitasking mechanism. For example, we have coroutine in Python, generator in ES6, coroutine in C++20. Though with different names, all of them have the same basic idea as Ruby's Fiber.
