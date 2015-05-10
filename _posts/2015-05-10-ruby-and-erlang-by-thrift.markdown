---
layout: post
title:  "Ruby và Erlang thông qua Thrift"
date:   2015-05-10 00:03:04
summary: Giới thiệu cách kết hợp Ruby và Erlang thông qua Thrift
description: Giới thiệu cách kết hợp Ruby và Erlang thông qua Thrift
categories: ruby erlang
---

Mỗi một ngôn ngữ đều có điểm mạnh và điểm yếu khác nhau. Trong các hệ thống lớn như Facebook, Twitter sử dụng nhiều ngôn ngữ khác nhau
tuỳ theo mục đích. Tuy nhiên việc kết hợp nhiều ngôn ngữ, framework trong một ứng dụng không hề đơn giản.
Ta có thể xây dựng theo mô hình microservice, các service connect với nhau thông qua API. Tuy nhiên cách này lại đem lại hiệu
quả không cao.

### Thrift là gì

Thrift là thư viện RPC được phát triển bởi Facebook, hiện tại dự án được host trên Apache tại http://thrift.apache.org

Trong bài viết này, ta sẽ viết một ứng dụng đơn giản bằng Ruby và Erlang được kết hợp thông qua Thrift.

### Compile thrift

Cài đặt Thrift khá đơn giản, ta có thể tải source code tại địa chỉ: http://www.apache.org/dyn/closer.cgi?path=/thrift/0.9.2/thrift-0.9.2.tar.gz

Trong quá trình compile, Thrift sẽ tìm các compiler đang được cài đặt trong máy và compile các module tương ứng cho tất cả các ngôn ngữ này.

Nếu chỉ muốn compile một số module, ta configure như sau

    ./configure --with-[PACKAGE]
                --without-[PACKAGE]

Ví dụ:

    ./configure --with-ruby --without-python

### .thrift file

Thrift file định nghĩa các interface giao tiếp giữa các ứng dụng với nhau.

Ví dụ sau định nghĩa hàm add thực hiện phép cộng

    # calculator.thrift
    service Calculator{
      i32 add(1:i32 num1, 2:i32 num2)
    }

### Thrift with Ruby

Ta compile file `calculator.thirft` trên cho Ruby bằng command

{% highlight bash %}
thrift --gen rb calculator.thrift
{% endhighlight %}

Thrift sẽ sinh ra thư mục gen-rb chứa các thư viện cần thiết để sử dụng.

### Server thrift in Ruby

Ta dựng một server thrift bằng Ruby. Server sẽ lắng nghe tại cổng 9000 khi có request đến server sẽ thực hiện phép cộng và trả về kết quả cho client.

{% highlight ruby %}
$:.push('gen-rb')
require 'thrift'
require 'calculator'

class CalculatorHandler
  def initialize
    @log = {}
  end

  def add(n1, n2)
    return n1 + n2
  end
end

handler = CalculatorHandler.new()
processor = Calculator::Processor.new(handler)
transport = Thrift::ServerSocket.new(9090)
transportFactory = Thrift::BufferedTransportFactory.new()
server = Thrift::SimpleServer.new(processor, transport, transportFactory)

puts "Starting the server..."
server.serve()
puts "done."
{% endhighlight %}

### Client bằng Ruby

{% highlight ruby %}
$:.push('gen-rb')
require 'thrift'
require 'calculator'

port = 9090
transport = Thrift::BufferedTransport.new(Thrift::Socket.new('127.0.0.1', port))
protocol = Thrift::BinaryProtocol.new(transport)
client = Calculator::Client.new(protocol)
transport.open()
sum = client.add(12, 13)
puts sum
transport.close()
{% endhighlight %}

{% highlight bash %}
ruby client.rb
=> 25
{% endhighlight %}

Tiếp theo, ta viết client bằng Erlang
### Client bằng Erlang

Không đơn giản như Ruby, để sử dụng được Thrift trong Erlang, ta cần thư viện thirft dành cho Erlang. Thư viện này được cung cấp trong thư mục source của thrift

    lib/erl

Hoặc có thể tải về tại địa chỉ:

https://github.com/apache/thrift/tree/master/lib/erl

Tiếp theo ta compile interface của class Calculator cho Erlang

{% highlight bash %}
thrift --gen erl calculator.thrift
{% endhighlight %}

Các file được sinh ra trong thư mục gen-erl.

Ứng dụng client như sau:

{% highlight erlang %}
% client.erl
-module(client).
-include("calculator_thrift.hrl").
-export([plus/0]).

plus() ->
  Port = 9090,
  {ok, Client0} = thrift_client_util:new("127.0.0.1",
    Port,
    calculator_thrift,
    []),
  {_, {ok, Sum}} = thrift_client:call(Client0, add, [12, 13]),
  io:format("12 + 13 = ~p~n", [Sum]).
{% endhighlight %}

Ta copy các file trong thư mục gen-erl và file clien.erl vào thư mục erl được download ở trên.

Trong thư mục erl, ta compile tất cả các thư viện(bao gồm cả file client.erl) bằng rebar:

    ./rebar compile

File compile được đặt trong thư mục ebin. Trong erl console, ta thực hiện thử hàm plus:

    1> client:plus(12, 13).
    12 + 13 = 25
    ok
