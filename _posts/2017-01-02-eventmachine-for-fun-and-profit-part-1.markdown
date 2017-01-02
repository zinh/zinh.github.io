---
layout: post
title:  "Giới thiệu về EventMachine, phần 1"
date:   2017-01-02 00:03:04
summary: Nếu đã từng làm qua Javascript, chắc hẳn sẽ rất quen thuộc với reactor pattern(callback, promise...). Với Ruby ta cũng có thể áp dụng reactor với hỗ trợ của gem EventMachine. Trong bài này, ta sẽ tìm hiểu cơ bản về reactor pattern và cách sử dụng với EventMachine.
description: Giới thiệu về EventMachine và ứng dụng reactor pattern trong Ruby
categories: ruby
---

Nếu đã từng làm qua Javascript, chắc hẳn sẽ rất quen thuộc với reactor pattern(callback, promise...). Với Ruby ta cũng có thể áp dụng reactor với hỗ trợ của gem EventMachine. Trong bài này, ta sẽ tìm hiểu cơ bản về reactor pattern và cách sử dụng với EventMachine.

### Trước hết, reactor pattern là gì?

Là pattern được áp dụng khá nhiều trong các ứng dụng web server, đặc biệt để giải quyết bài toán C10k, được dùng trong Nginx hay gần đây là Apache(thông qua event mpm). Về cơ bản reator pattern bao gồm các thành phần:

- __Event-loop__: là một vòng lặp, khi một event nào đó xảy ra(ví dụ như nhận được data từ client thông qua socket), event-loop sẽ gọi hàm xử lý tương ứng(hay còn gọi là request handler).
- __Event Handler__: là các hàm callback được gọi để xử lý một event nào đó.

### Tại sao reactor lại được áp dụng trong web server?

Khi viết một ứng dụng tuần tự, khi bạn cần đọc một file, hay ghi dữ liệu vào một socket, mặc định tác vụ ghi và đọc đó sẽ block chương trình của bạn lại cho đến khi tác vụ IO đó hoàn tất, khi đó chương trình mới tiếp tục được thực thi. Vì thế, giả sử web server của bạn nhận một connection từ client, web server sẽ rơi vào tình trạng blocking để đợi data gửi từ client lên, và trong lúc server blocking một client khác muốn connect đến server sẽ phải đợi. Để có thể handle nhiều client cùng một lúc, một số web server đã áp dụng kỹ thuật multi-process hoặc multi-thread. Tuy nhiên, ngoài ra ta còn có thể áp dụng reactor để handle trường hợp này.

Chẳng hạn, một ứng dụng web server như Nginx, server sẽ bao gồm một event-loop, event-loop này sẽ nhận tất cả connection từ client, một khi client connect, event-loop sẽ lưu lại connection data vào buffer, khi data đã gửi hoàn chỉnh, event-loop mới gọi event-handler để xử lý request này.

### Reactor khác gì với multi-thread?
Về cơ bản, reactor pattern thường được dùng với single-thread, đồng nghĩa với việc ta sẽ không cần quan tâm đến các vấn đề share-memory hay race-condition. Tuy nhiên, do chỉ được thực thi qua 1 thread, chương trình sẽ không tận dụng được kiến trúc multi-core của CPU, do đó với các ứng dụng CPU-bound, reactor pattern là một lựa chọn không tốt. Điểm mạnh của reactor chỉ được phát huy khi ứng dụng thuộc vào loại IO-bound(và điều nay thường đúng với các ứng dụng web).

Lý thuyết là vậy, sau đây ta sẽ xem reactor pattern được ứng dụng vào EventMahine như thế nào.

### EventMachine

Có repo tại: https://github.com/eventmachine/eventmachine, EventMachine là một gem được phát triển từ khá lâu(2006). EventMachine tương thích với các phiên bản ruby từ 1.8.7, JRuby, và có thể sử dụng trên Windows.

### Sử dụng EventMachine

Trong EventMachine để bắt đầu một event-loop ta sử dụng function `EventMachine.run(&block)` như sau:

{% highlight ruby %}
EventMachine.run{
  # Code khởi tạo cho event-loop
}
{% endhighlight %}

Khi ta gọi `EventMachine.run` và truyền vào một block, EventMachine sẽ chạy block đó trước tiên(xem như bước khởi tạo), sao khi block đó được chạy xong, EventMachine sẽ bắt đầu event-loop, là một vòng lặp vô tận, khi có môt event nào xảy ra, vòng lặp này sẽ dừng lại, gọi hàm call-back đăng ký với event đó, sau khi callback thực thi xong, vòng lặp sẽ tiếp tục.

Như vậy ta sẽ để code gì trong block khởi tạo của `EventMachine.run`?

Chẳng hạn, đoạn code sau:

{% highlight ruby %}
EM.run do
  puts "This will run once"
end
{% endhighlight %}

Hiểu một cách nôm na, đoạn code trên tương tự như sau:

{% highlight ruby %}
puts "This will run once"
while true
end
{% endhighlight %}

*Sau đây, để cho ngắn gọn, ta có thể dùng `EM` thay cho `EventMachine`.*

Đoạn block truyền vào EM.run chỉ được thực thi 1 lần vậy làm sao để thực thi một đoạn code qua trong vòng lặp của event-loop?

### EM.next_tick

Với `EM.next_tick(&block)` block sẽ được thực thi ở vòng lặp tiếp theo của EventMachine, có nghĩa:

{% highlight ruby %}
EM.run{
  EM.next_tick{ puts "Hello, world" }
}
{% endhighlight %}

sẽ tương đương với:

{% highlight ruby %}
n = 0
while(true)
  if n.zero?
    puts "Hello, world"
    n++
  end
end
{% endhighlight %}

Nếu ta muốn thực thi block ở mỗi vòng lặp ta sẽ phải gọi tiếp __next_tick__ trước khi kết thúc block. Ví dụ

{% highlight ruby %}
EM.run{
  callback = proc{
    puts "Hello, world"
    EM.next_tick(&callback)
  }
  EM.next_tick(&callback)
}
{% endhighlight %}

Tương đương với

{% highlight ruby %}
while(true)
  puts "Hello, world"
end
{% endhighlight %}

Nhưng thay vì phải gọi `EM.tick_loop` như vậy EventMachine cung cấp hàm `EM::TickLoop` giúp ta viết code ngắn gọn hơn:

### EM::TickLoop

{% highlight ruby %}
EM.run do
  EM.tick_loop {
    puts "Hello, world"
  }
end
{% endhighlight %}

### EM::Iterator

Tiếp theo, nếu ta có một mảng các phần tử và muốn mỗi vòng lặp lấy ra một phần tử trong mảng này để xử lý, ta có thể dùng `EM::Iterator` như sau:

{% highlight ruby %}
EM.run do
  EM::Iterator.new(1..1000, 1).each do |item, iter|
    puts item
    iter.next
  end
end
{% endhighlight %}

Đoạn code trên tương đương với:

{% highlight ruby %}
items = (1..1000).to_a
while(true)
  if (item = items.shift)
    puts item
  end
end
{% endhighlight %}

### EM::Timer

Vói EM::Timer ta tạo một event(giống như hẹn giờ), khi event xảy ra, event-loop sẽ gọi callback tương ứng.

Có 2 loại timer event, event chỉ xảy ra 1 lần, và event theo chu kỳ

- EM.add_timer hay EM::Timer.new: event xảy ra 1 lần
- EM.add_periodic_timer hay EM::PeriodicTimer.new: event xảy ra theo chu kỳ thời gian

Ví dụ:

{% highlight ruby %}
EM.run do
  EM.add_timer(1){ puts "Hello, world" }
end
{% endhighlight %}
Đoạn code trên có nghĩa ta sẽ đặt một timer event, event này sẽ xảy ra sau 1 giây, khi event xảy ra, sẽ thực thi đoạn code `puts "Hello, world"`

Tương tự với `EM::PeriodicTimer` sẽ tạo event timer theo chu kỳ, ví dụ như đoạn code bên dưới, ta tạo một event theo chu kỳ cứ mỗi 1 giây sẽ xảy ra, và khi event xảy ra, sẽ thực thi đoạn code `puts "Hello, world"`

{% highlight ruby %}
EM.run do
  EM.add_periodic_timer(1){ puts "Hello, world" }
end
{% endhighlight %}

Trên đây là một số function cơ bản của EventMachine, trong bài sau, ta sẽ đi sâu vào các method liên quan đến IO event để thấy được sức mạnh của EventMachine.
