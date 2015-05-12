---
layout: post
title:  "Tìm hiểu về Apache Thrift"
date:   2015-05-12 00:03:04
summary: Mỗi một ngôn ngữ đều có điểm mạnh và điểm yếu khác nhau. Trong các hệ thống lớn như Facebook, Twitter nhiều ngôn ngữ khác nhau được sử dụng để đạt được performance cao nhất. Tuy nhiên việc kết hợp nhiều ngôn ngữ, framework trong một ứng dụng không hề đơn giản. Thrift cung cấp một giải pháp giúp các process được implement bằng các ngôn ngữ khác nhau giao tiếp với nhau một cách dễ dàng. Bài viết này giới thiệu về Thrift thông qua ví dụ client/server bằng Ruby và Erlang
description: Giới thiệu cách kết hợp Ruby và Erlang thông qua Thrift
categories: ruby erlang
---

Mỗi một ngôn ngữ đều có điểm mạnh và điểm yếu khác nhau. Trong các hệ thống lớn như Facebook, Twitter nhiều ngôn ngữ khác nhau được sử dụng để đạt được performance cao nhất. Tuy nhiên việc kết hợp nhiều ngôn ngữ, framework trong một ứng dụng không hề đơn giản. Thrift cung cấp một giải pháp giúp các process được implement bằng các ngôn ngữ khác nhau giao tiếp với nhau một cách dễ dàng. Bài viết này giới thiệu về Thrift thông qua ví dụ client/server bằng Ruby và Erlang

### Thrift là gì

Thrift là thư viện RPC được phát triển bởi Facebook, hiện tại dự án được host trên Apache tại http://thrift.apache.org

Trong bài viết này, ta sẽ viết một ứng dụng đơn giản bằng Ruby và Erlang kết nối với nhau thông qua Thrift.

### Cài đặt thrift

Cài đặt Thrift khá đơn giản, ta có thể tải source code mới nhất tại địa chỉ:

[http://thrift.apache.org/download](http://thrift.apache.org/download){:target="_blank"}{:rel="nofollow"}


Trong quá trình compile, Thrift sẽ tìm các compiler đang được cài đặt trong máy và compile các module tương ứng cho tất cả các ngôn ngữ này.

Nếu chỉ muốn compile một số module, ta configure như sau

    ./configure --with-[PACKAGE]
                --without-[PACKAGE]

Ví dụ:

    ./configure --with-ruby --without-python

### .thrift file

Thrift file định nghĩa interface giao tiếp giữa client và server với nhau. Có thể hiểu file .thrift giống như file header `.h` của C.
File .thrift có cú pháp rất đơn giản, được mô tả chi tiết tại địa chỉ:

[http://thrift.apache.org/docs/idl](http://thrift.apache.org/docs/idl){:target="_blank"}{:rel="nofollow"}

Ví dụ sau định nghĩa một service cung cấp hàm add thực hiện phép cộng 2 số:

    # calculator.thrift
    service Calculator{
      i32 add(1:i32 num1, 2:i32 num2)
    }

Tương ứng với từng ngôn ngữ, Thrift sẽ compile file .thrift thành các thư viện của ngôn ngữ đó.

Chẳng hạn, để compile thành thư viện dùng cho Ruby ta dùng command:

{% highlight bash %}
 thrift --gen rb calculator.thrift
{% endhighlight %}

### Thrift with Ruby

Để sử dụng thrift với Ruby trước tiên ta cần cài gem [thrift](https://rubygems.org/gems/thrift){:target="_blank"}{:rel="nofollow"}. Sau đó ta import file được compile từ file `.thrift`. Để compile interface cho Ruby ta dùng command:

{% highlight bash %}
 thrift --gen rb calculator.thrift
{% endhighlight %}

Thrift sẽ sinh ra thư mục `gen-rb` chứa các thư viện cần thiết để sử dụng.

#### Server in Ruby

Ta dựng một server thrift bằng Ruby. Server sẽ lắng nghe tại cổng 9090 khi có request đến server sẽ thực hiện phép cộng và trả về kết quả cho client.

{% highlight ruby %}
# server.rb
$:.push('gen-rb')
require 'thrift'
require 'calculator'

# Handle Calculator service
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

#### Client in Ruby

Tương tự như server, một client viết bằng Ruby cần có các file `gen-rb` được Thirft compile.

{% highlight ruby %}
# client.rb
$:.push('gen-rb')
require 'thrift'
require 'calculator'

port = 9090
transport = Thrift::BufferedTransport.new(Thrift::Socket.new('127.0.0.1', port))
protocol = Thrift::BinaryProtocol.new(transport)
client = Calculator::Client.new(protocol)
transport.open()
sum = client.add(12, 13)
puts "12 + 13 = #{sum}"
transport.close()
{% endhighlight %}

{% highlight bash %}
ruby client.rb
=> 12 + 13 = 25
{% endhighlight %}

Ở code trên ta thấy, nhờ có thrift việc gọi hàm add của service Calculator được thực hiện giống như việc gọi hàm của cùng một ứng dụng. Thrift đã đảm nhiệm phần
trao đổi encode decode dữ liệu.

Tuy nhiên, sức mạnh của Thrift không dừng lại ở đó. Ta còn có thể gọi một service được viết bằng ngôn ngữ khác y như gọi một hàm local. Phần tiếp theo, ta sẽ viết
một client bằng Erlang request đến service Calculator đã được implement bằng Ruby ở trên.

### Thrift with Erlang

Không đơn giản như Ruby, để sử dụng được Thrift trong Erlang, ta cần thư viện thirft dành cho Erlang. Thư viện này được cung cấp trong thư mục source code của thrift

    thrift_source/lib/erl

Hoặc có thể tải về tại địa chỉ:

[https://github.com/apache/thrift/tree/master/lib/erl](https://github.com/apache/thrift/tree/master/lib/erl){:target="_blank"}{:rel="nofollow"}

Tiếp theo ta compile interface của service `Calculator` cho Erlang

{% highlight bash %}
 thrift --gen erl calculator.thrift
{% endhighlight %}

Các file được sinh ra trong thư mục `gen-erl`.

Ứng dụng client như sau:

{% highlight erlang %}
% client.erl
-module(client).
-include("calculator_thrift.hrl").
-export([plus/2]).

plus(A, B) ->
  Port = 9090,
  {ok, Client0} = thrift_client_util:new("127.0.0.1",
    Port,
    calculator_thrift,
    []),
  {_, {ok, Sum}} = thrift_client:call(Client0, add, [A, B]),
  io:format("~p + ~p = ~p~n", [A, B, Sum]).
{% endhighlight %}

Ta copy các file trong thư mục `gen-erl` và file `client.erl` vào thư mục lib erl được download ở trên.

Trong thư mục lib erl, ta compile tất cả các thư viện(bao gồm cả file client.erl) bằng rebar:

     ./rebar compile

File compile được đặt trong thư mục ebin. Trong erl console, ta thực hiện thử hàm plus:

    1> client:plus(12, 13).
    12 + 13 = 25
    ok

Như vậy ta thấy Thrift cung cấp đầy đủ công cụ để các process giao tiếp hiệu quả với nhau. Ta không cần phải lo lắng đến việc
encode/decode data, transport chúng như thế nào. Nhờ đó việc trao đổi giữa client/server trở nên cực kì đơn giản.
