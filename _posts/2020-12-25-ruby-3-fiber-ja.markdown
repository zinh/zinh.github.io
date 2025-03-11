---
layout: post
title: "Ruby 3: Non-blocking Fiber"
date: 2020-12-25 00:16:00
summary: この投稿では、Ruby 3の新機能ノンブロッキングファイバー について探りながら、簡単なファイバースケジューラーを実装してみるよ！
description: この投稿では、Ruby 3の新機能ノンブロッキングファイバーについて探りながら、簡単なファイバースケジューラーを実装してみるよ！
categories: ruby
---

### Ruby 3がついにリリース！(2020/12/25)

Ruby 3が今日（2020/12/25）ついにリリースされた！  
新機能がたくさん追加されてるけど、特に注目すべきなのは以下の3つ：

- **静的型（Static type）**
- **Ractor（並行処理の新機能）**
- **ノンブロッキングファイバー（Non-blocking Fiber）**

今回はこの中でも **ノンブロッキングファイバー** について掘り下げてみるよ。

## そもそもFiberって？

実は数ヶ月前にFiberの入門記事を書いたことがある。  
もしFiberについて知らないなら、まずはこっちを読んでみて！  

[Rubyのファイバーを使ったイベント駆動型ノンブロッキングIO](/ruby/2020/01/20/event-driven-with-ruby-fiber-ja.html)

## Ruby 3のFiberに追加された`blocking`オプション

Ruby 3では、`Fiber.new`に **blockingオプション** が追加された。  
これがどういう意味を持つのか見ていこう。

- `blocking: true` → これは今までのFiberと同じ動作。
- `blocking: false`（デフォルト）→ **ノンブロッキングファイバー** になる。

`blocking: false`のファイバーは、IOやネットワーク通信、`sleep`などの**ブロッキング操作**を行うと、自動で`yield`して制御を他のファイバーに渡す。  
これによって、処理が止まらずスムーズに並行処理できるようになる！

## どうやって処理を再開するの？

じゃあ、IO操作が終わった後、どうやって元のファイバーを再開させるの？  
答えは **スケジューラー（イベントループ）** だ！

スケジューラーは「どのファイバーがブロック中なのか」を管理し、処理を再開できるタイミングでファイバーを`resume`する。  
Ruby自体にはスケジューラーが組み込まれてないので、自分で実装する必要がある。

次の章では、簡単なスケジューラーを作ってみよう！

# Fiber.scheduler を作ってみる！

スケジューラーの役割はシンプル。

- **どのファイバーがブロック中かを管理する**
- **ブロックが解除されたら、そのファイバーを再開する**

スケジューラーを作るには、次のフックを実装する必要がある：

- `io_wait`（IO待ち）
- `process_wait`（プロセス待ち）
- `kernel_sleep`（`sleep`処理）
- `block` / `unblock`（ロック処理）

これらのフックは、ノンブロッキングファイバーがブロッキング操作を行ったときに呼び出される。

### 超シンプルなスケジューラーの実装

まずは最低限のスケジューラーを作ってみよう。

```ruby
class Scheduler
  def io_wait(io, events, timeout)
  end

  def kernel_sleep(duration = nil)
  end

  def process_wait(pid, flags)
  end

  def block(blocker, timeout = nil)
  end

  def unblock(blocker, fiber)
  end
  
  def close
  end
end
```

これを`Fiber.set_scheduler`で登録すれば、ノンブロッキングファイバーを動かせるようになる。

## `kernel_sleep` フックを実装しよう

まずは `sleep` をノンブロッキングで動かせるようにしてみよう。

```ruby
require 'fiber'

class SimpleScheduler
  def initialize
    @waiting = {} # どのファイバーがいつまでsleepするかを管理
  end

  def run
    while @waiting.any?
      @waiting.keys.each do |fiber|
        if current_time > @waiting[fiber]
          @waiting.delete(fiber)
          fiber.resume
        end
      end
    end
  end

  def kernel_sleep(duration = nil)
    @waiting[Fiber.current] = current_time + duration
    Fiber.yield
    return true
  end

  def close
    run
  end

  private
  def current_time
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end
end
```

これで `sleep` がブロッキングしなくなる！

## `io_wait` を実装する

次に、IOのノンブロッキングを実装しよう。

```ruby
class SimpleScheduler
  def initialize
    @readable = {}
    @writable = {}
    @waiting = {}
  end

  def io_wait(io, events, timeout)
    unless (events & IO::READABLE).zero?
      @readable[io] = Fiber.current
    end
  
    unless (events & IO::WRITABLE).zero?
      @writable[io] = Fiber.current
    end

    Fiber.yield
    return events
  end
end
```

IOの状態を監視して、準備ができたらファイバーを再開させる感じだね。

## `block/unblock` の実装

最後に、ブロッキング状態の管理を追加しよう。

```ruby
def block(blocker, timeout = nil)
  @blocking += 1
  begin
    Fiber.yield
  ensure
    @blocking -= 1
  end
end

def unblock(blocker, fiber)
  @ready << fiber
  io = @urgent.last
  io.write_nonblock('.')
end
```

この機能を組み込めば、HTTPリクエストなどの非同期処理もスムーズに扱える！

## まとめ

Ruby 3の**ノンブロッキングファイバー**は、今まで以上に効率的な並行処理を実現できる！  
ただし、Ruby自体にはスケジューラーが含まれていないので、自分で実装するか、[Async](https://github.com/socketry/async) のようなライブラリを使うのがベスト。

とはいえ、まだ開発中の機能なので、すべてのIO処理が完全にノンブロッキングになっているわけではない。  
今後のアップデートでより使いやすくなるのを期待しよう！

### 改良ポイント
- `IO.select` のタイムアウトを適切に設定すると、CPU負荷を減らせるかも？
- `process_wait` の実装も試してみよう！
- イベントループの効率化も考えてみよう！

Ruby 3、めちゃくちゃ進化してるね！  
ノンブロッキングファイバーを活用して、もっと効率的なコードを書いていこう

<script src="https://gist.github.com/zinh/71fc781d2f5fe94ea8cfdd2ff241eb9d.js"></script>
