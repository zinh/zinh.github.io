---
layout: post
title: "RubyのFiberを使用したイベント駆動型ノンブロッキングIO"
date: 2020-01-20 15:16:00
summary: この投稿では、RubyのFiberとその並行処理におけるいくつかの応用について紹介します。
description: この投稿では、RubyのFiberとその並行処理におけるいくつかの応用について紹介します。
categories: ruby
---

FiberはRuby 1.9から導入されています。しかし、最近ではRubyの並行処理性能の向上に向けた積極的な開発により、再び注目されています。本記事では、Fiberの基本的な使い方について説明します。

簡単に言うと、Fiberは停止と再開が可能な関数です。この「関数を任意のタイミングで停止・再開できる」ことがどのように役立つのかを理解するために、従来の逐次実行モデルと比較してみましょう。

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

実行順序としては、`foo` が完了しない限り `bar` は開始できません。つまり、`foo` が実行中の間は `bar` は動作しません。その結果、次のような出力になります:

~~~
foo 1
foo 2
bar 1
bar 2
~~~

このモデルでは、どのようにして `foo` と `bar` を同時に実行できるでしょうか？

簡単です。それぞれを独自のスレッドに配置すればよいのです。（ただし、MRI Ruby の GIL により `foo` と `bar` が並行実行されることはありませんが、ここでは仮に並行して実行されると想定するか、あるいは JRuby を使用することを考えましょう。）

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

`foo` と `bar` の出力が交互に入り混じっているのが分かります。

~~~
bar 1
foo 1
bar 2
foo 2
~~~

各関数ごとに新しいスレッドを生成することで、OS（または今回の場合はRubyのVM）が `foo` と `bar` をいつどのように同時実行するかを決定します。  
このモデルは *プリエンプティブマルチタスキング（Preemptive Multitasking）* として知られています。

一方で、*協調型マルチタスキング（Cooperative Multitasking）*（または *非プリエンプティブマルチタスキング（Non-Preemptive Multitasking）*）と呼ばれる別のモデルも存在します。  
このモデルでは、OSやVMが関数のスケジュールを管理するのではなく、自分自身で関数を開始・停止・再開することで並行処理を実現します。  
RubyのFiberは、タスクを自分でスケジュールするための基本的な仕組みを提供しています。

では、いくつかの例を見てみましょう。

### Fiberについて

Fiberを定義するには、`Fiber.new` を使用します。

~~~rb
# fiber.rb
foo = Fiber.new do
  puts "foo 1"
  Fiber.yield
  puts "foo 2"
end

bar = Fiber.new do
  puts "bar 1"
  Fiber.yield
  puts "bar 2"
end
~~~

`fiber.rb` を実行しても何も起こりません。これは、まだFiberを開始していないためです。  
Fiberを開始するには、`Fiber#resume` を使用します。

~~~rb
foo.resume
bar.resume
~~~

次のような出力が得られます。

~~~
foo 1
bar 1
~~~

今回の例では、`Fiber.yield` を使用しました。これは、現在のFiberの実行を一時停止し、制御を親側に戻すことを意味します。

最初の `foo.resume` の呼び出しでは、`foo` を最初の `yield` に到達するまで実行し、そこで停止します。  
その後、`bar` を実行し、同様に最初の `yield` で停止します。  
この動作によって、出力結果が説明できます。

次に、`bar` の実行を継続させ、その後 `foo` に切り替えることができます。

~~~rb
foo.resume # output: foo 1
bar.resume # output: bar 1
bar.resume # output: bar 2
foo.resume # output: foo 2
~~~

ご覧の通り、出力が `foo` と `bar` の間で交互に切り替わり、まるでマルチスレッドのような動作をしています。  

次に、Fiber間でメッセージをやり取りする方法を見ていきましょう。

## fiberとメッセージを送る方法

~~~rb
foo = Fiber.new do |a|
        b = a * Fiber.yield("hello")
        return b
      end
value1 = foo.resume(6) # inside fiber: a = 6; value1 = hello
value2 = foo.resume(7) # inside fiber: Fiber.yield return 7; val2 = 42
~~~

**呼び出し元からFiberへ値を渡す**

Fiberに値を渡すには、`Fiber#resume` の引数として渡します。

- 最初の `foo.resume(6)` の呼び出しでは、`6` が `foo` の初期パラメータ（つまり `a`）として渡されます。  
- 2回目の `foo.resume(7)` の呼び出しでは、Fiberの内部で `7` が `Fiber.yield` の戻り値となるため、`b = 6 * 7` となります。

**Fiberから呼び出し元へ値を渡す**

Fiberから呼び出し元に値を渡すには、`Fiber.yield` の引数として渡します。

- 最初の `Fiber.yield` の呼び出しでは、文字列 `"hello"` をFiberの呼び出し元に返すため、`value1 = "hello"` となります。  
- 2回目の `resume` の呼び出しでは、`b` の値（`42`）が返されるため、`value2 = 42` となります。

次に、Fiberの応用に入る前に、**無限に続くフィボナッチ数列のジェネレーター** を実装してみましょう。

~~~rb
fibo = Fiber.new do
  a, b = 1, 1
  while true
    Fiber.yield(a)
    a, b = b, a + b
  end
end

10.times{ puts fibo.resume }
~~~

## fiberの応用: EventMachineとの組み合わせ

FiberをEventMachineと組み合わせることで、より直感的にプログラムを構築する別の方法が得られます。  

ここに簡単な例を示します:

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

`async_get` は、EventMachine のコールバック機構を Fiber 内にラップしており、コードをまるで逐次実行されているかのように見せることができます。  
この使い方は、JavaScript の *async/await* 機構に似た動作をします。

また、コード内で `Fiber.current` を使用しています。これは現在実行中の Fiber を返すもので、この関数は `fiber` ライブラリに定義されているため、`require 'fiber'` が必要になります。

## fiberの応用: ノンブロッキングIO

Fiber を活用することで、ノンブロッキングIOを簡単に実装できます。  
ここでは、Fiber を使って **エコーサーバー** を作成してみましょう。

基本的なアイデアとしては、**各TCP接続に対応するFiberを管理するために、Hash（ハッシュ）を維持する** というものです。

~~~rb
class Reactor
  def initialize
    @readable = {}
    @writeable = {}
  end
end
~~~

イベントループ内では、`IO.select`（これはブロッキング呼び出し）を使用して、利用可能なTCP接続があるかをチェックします。  
その後、その接続に対応するFiberを再開 (`resume`) するだけです。

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

ここでは、`@readable` と `@writeable` に追加するための2つのメソッドを定義します。  
その後、Fiber を一時停止し、イベントループによって再開されるのを待ちます。

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

では、メインプログラムに移りましょう。  
まず、オブジェクトを初期化します。

~~~rb
reactor = Reactor.new
server = TCPServer.new('localhost', 8080)
~~~

次に、`server` 用の Fiber を作成し、接続ごとに新しい Fiber を作成します。

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

このプログラムにより、スレッドやマルチプロセスを使用せずに **並行接続（concurrent connections）** を処理できることが分かります。

また、`await_readable` と `await_writeable` は **ES6 の `async/await` 機構を模倣** したものです。

## **補足**

Fiber は Ruby 固有の概念ではなく、**多くのプログラミング言語が非プリエンプティブなマルチタスキングの仕組みを持っています**。例えば:

- **Python**: `asyncio` のコルーチン  
- **JavaScript (ES6)**: `generator`  
- **C++20**: `coroutine`  

名前こそ異なりますが、これらは **Ruby の Fiber と同じ基本概念** に基づいています。

## **参考文献**

このリアクターサーバーのコードは、[Fibers Are the Right Solution](https://www.codeotaku.com/journal/2018-11/fibers-are-the-right-solution/index) から引用しました。
