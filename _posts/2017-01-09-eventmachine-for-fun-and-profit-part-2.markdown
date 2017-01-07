---
layout: post
title:  "Giới thiệu về EventMachine, phần 2"
date:   2017-01-02 00:03:04
summary: Trong bài trước mình đã giới thiệu qua các khái niệm cơ bản của EventMachine, phần tiếp theo của loạt bài này, ta sẽ đi sâu vào một số hàm xử lý các event IO(đặc biệt là xử lý socket IO) để thấy được sức mạnh của EventMachine.
description: Trong bài trước mình đã giới thiệu qua các khái niệm cơ bản của EventMachine, phần tiếp theo của loạt bài này, ta sẽ đi sâu vào một số hàm xử lý các event IO(đặc biệt là xử lý socket IO) để thấy được sức mạnh của EventMachine.
categories: ruby
---

Trong bài viết này, để làm quen với network event ta sẽ viết một ứng dụng echo server đơn giản. Server này sẽ lắng nghe message từ client và reply lại chính message đó cho client.

Trong phiên bản đầu tiền của echo server ta sẽ dùng library socket được cung cấp sẵn trong Ruby.

### Simple echo server

{% highlight ruby %}
require 'socket'

server = TCPServer.new 8080

puts "Server started"
loop do
  client = server.accept
  line = client.gets
  client.puts(line)
  client.close
end
{% endhighlight %}

Để test chương trình, ta có thể dùng chương trình telnet để connect đến đến localhost qua port 8080(`telnet localhost 8080`), server sẽ reply lại message ta gửi lên và đóng connection.

Tuy nhiên chương trình trên có một điểm yếu ở chỗ chỉ có thể handle 1 connection, nếu đang có một client connect vào server và một client thứ hai cũng muốn connect, client thứ hai này sẽ phải đợi cho đến khi client 1 close connection mới có thể connect vào server.

Để có thể handle nhiều connection, ta có thể spawn một thread mới cho từng connection, cụ thể ta sẽ viết lại phiên bản 2 của echo server như sau:

### Multi-thread echo server

{% highlight ruby %}
server = TCPServer.new 8080
loop do
  # spawn thread mới khi có connect từ client
  Thread.new(server.accept) do |client|
    line = client.gets
    client.puts(line)
    client.close
  end
end
{% endhighlight %}

với phiên bản multi-thread, ta đã có thể handle được nhiều client cùng lúc. Tuy nhiên với Eventmachine ta có một cách khác để handle nhiều connection cùng lúc thông qua non-blocking IO event API.

### Non-blocking IO Event với Linux

Trên Linux, non-blocking IO có thể được sử dụng thông qua system call [select(2)](http://man7.org/linux/man-pages/man2/select.2.html){:target="_blank"}{:rel="nofollow"} hoặc mới hơn(Linux 2.6) là cơ chế [epoll(7)](http://man7.org/linux/man-pages/man7/epoll.7.html){:target="_blank"}{:rel="nofollow"}. Nếu làm việc trên MacOS hoặc BSD-base ta có thể dùng [kqueue(2)](https://www.freebsd.org/cgi/man.cgi?query=kqueue&sektion=2){:target="_blank"}{:rel="nofollow"} và Eventmachine đều hỗ trợ tất cả các cơ chế này. Mặc định nếu hệ thống không hỗ trợ epoll(7) hoặc kqueue(2), Eventmachine sẽ sử dụng mặc định system call select(2), tuy nhiên select(2) có một số hạn chế và performance không được tốt, do đó nếu hệ thống hỗ trợ, bạn nên sử dung epoll hoặc kqueue sẽ đem lại hiệu quả tốt hơn.

Để sử dụng, ta chỉ đơn giản gọi function `EM.epoll` hoặc `EM.kqueue` trước khi chạy event-loop.

{% highlight ruby %}
EM.epoll
# EM.kqueue
EM.run{
}
{% endhighlight %}

Trở lại ứng dụng echo server, ta viết lại phiên bản sử dụng system call select(2) như sau:

### Evented echo server version 1

{% highlight ruby %}
server = TCPServer.new(8080)
clients = []
buffers = {}
clients << server
loop do
  sockets = [server] + clients
  readable, writeable = IO.select(sockets)
  readable.each do |sock|
    begin
      if sock == server
        clients << server.accept_nonblock
      else
        client, buf = sock, buffers[sock] ||= ''
        buf = sock.read_nonblock(1024)
        if buf =~ /^.+?\r?\n/
          client.write(buf)
          clients.delete(client)
          buffers.delete(client)
          client.close
        end
      end
    rescue IO::EAGAINWaitReadable
    end
  end
end
{% endhighlight %}

Trong chương trình ở trên, ta đã sử dụng function [IO.select](http://ruby-doc.org/core-2.0.0/IO.html#method-c-select){:target="_blank"}{:rel="nofollow"}, function này sẽ gọi system call select(2). Function select sẽ nhận vào một mảng là các file descriptor và trả về danh sách các file descriptor có thể được ghi/đọc. Trong ví dụ của ta là các socket ở trạng thái đọc có nghĩa là socket đó có data gửi từ client hoặc socket đó có connection mới.

Một điểm cần lưu ý khi sử dụng select(2) ở chỗ chương trình của ta sẽ phải chịu trách nhiệm quản lý khi nào một request hoàn chỉnh. Trong ví dụ ở trên, ta xem một request hoàn chỉnh khi nhận được ký tự `\r\n`, khi nhận được một request chưa hoàn chỉnh server lưu tạm nội dung vào một array buffer. Đến khi request được nhận hoàn chỉnh, server mới reply lại cho client.

### Evented echo server version 2

Với hỗ trợ của eventmachine, ta không cần phải quan tâm đến việc quản lý danh sách socket hay buffer request từ client. Cụ thể ta sẽ viết lại echo server phiên bản 2 như sau:

{% highlight ruby %}
module EchoServer
  def post_init
    puts "New connection"
  end

  def receive_data data
    send_data data
    close_connection if data =~ /quit/i
  end

  def unbind
    puts "Someone disconnected"
  end
end

EM.run do
  EM.start_server "127.0.0.1", 8081, EchoServer
end
{% endhighlight %}

Eventmachine cung cấp function `start_server` giúp ta dựng một server TCP, function này nhận vào params lần lượt là IP, port dùng để lắng nghe và một tham số quan trọng ở đây là module callback. Module này sẽ định nghĩa các method callback, Eventmachine sẽ gọi các method này khi event tương ứng xảy ra.

Trong ví dụ trên, ta định nghĩa 3 method tương ứng với 3 event: connection mới từ client(`post_init`), client gửi message(`receive_data`) và client close connection(`unbind`)

Ta thấy Eventmachine đã giúp ta trong việc kiểm tra tình trạng của socket(mà ở trước đó ta phải dùng select), buffer message từ client và gửi data cho client(thông qua method `send_data`)

Trên đây là một ứng dụng server đơn giản bằng eventmachine. Để có thể viết một ứng dụng client hoàn chỉnh, ta có thể dùng [EM.connect](http://www.rubydoc.info/github/eventmachine/eventmachine/EventMachine#connect-class_method){:target="_blank"}{:rel="nofollow"} để connect đến server. Ngoài ra, còn có rất nhiều thư viện hỗ trợ các protocol khác như http([em-http-request](https://github.com/igrigorik/em-http-request){:target="_blank"}{:rel="nofollow"}) hay [mysql](https://github.com/brianmario/mysql2){:target="_blank"}{:rel="nofollow"}.

Tham khảo thêm:

[http://www.rubydoc.info/github/eventmachine/eventmachine/EventMachine#start_server-class_method](http://www.rubydoc.info/github/eventmachine/eventmachine/EventMachine#start_server-class_method){:target="_blank"}{:rel="nofollow"}

[http://www.rubydoc.info/github/eventmachine/eventmachine/EventMachine/Connection](http://www.rubydoc.info/github/eventmachine/eventmachine/EventMachine/Connection){:target="_blank"}{:rel="nofollow"}
