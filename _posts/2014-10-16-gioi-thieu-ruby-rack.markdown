---
layout: post
title:  "Giới thiệu Ruby Rack"
date:   2014-10-16 23:55:00
summary: Nếu đã từng lập trình web với Ruby, bạn đã làm việc với Rack. Có thể nói Rack chính là nền tảng cho các web framework của Ruby. Từ Sinatra, Rails, đến các framework gần đây như Lotus đều dựa trên nền tảng của Rack. Tìm hiểu về Rack giúp ta có hiểu được cách thức hoạt động của các web framework, từ đó tùy biến chúng dễ dàng hơn.
categories: ruby
---

Nếu đã từng lập trình web với Ruby, bạn đã làm việc với Rack. Có thể nói Rack chính là nền tảng cho các web framework của Ruby.
Từ Sinatra, Rails, đến các framework gần đây như Lotus đều dựa trên nền tảng của Rack. Tìm hiểu về Rack giúp ta có hiểu được cách
thức hoạt động của các web framework, từ đó tùy biến chúng dễ dàng hơn.

__1. Rack là gì?__

Document của Rack cung cấp thông tin về Rack như sau:

> Rack provides a minimal interface between webservers supporting Ruby and Ruby frameworks. 

Vậy có thể hiểu Rack là bước đệm giữa web server và framework Ruby. Webserver ở đây có thể là WEBrick, Thin, Unicorn, Puma, và web framework
ở đây có thể là Rails, Sinatra, ... Webserver và web framework sẽ dùng Rack để nói chuyện với nhau.

__2. Ứng dụng Rack đơn giản__

Một Rack application có cấu trúc rất đơn giản: nó là một Ruby Object, định nghĩa hàm `call`. Hàm `call` này có tham số là một biến environment và trả về response.
Response là một array có 3 item:

  - HTTP response code
  - Header
  - Body của response

Ta thử viết một Rack application đơn giản như sau:

Tạo file `config.ru` có nội dung:

{% highlight ruby %}
# config.ru
class SimpleRack
  def self.call(env)
    [200,
      {"Content-Type" => "text/plain"},
      ["Hello from Rack!"]
    ]
  end
end

run SimpleRack
{% endhighlight %}

`gem install rack`  nếu chưa cài gem rack.

Để chạy ứng dụng Rack trên ta dùng lệnh

{% highlight bash %}
$ rackup
[2014-10-14 18:07:27] INFO  WEBrick 1.3.1
[2014-10-14 18:07:27] INFO  ruby 2.1.2 (2014-05-08) [x86_64-linux]
[2014-10-14 18:07:27] INFO  WEBrick::HTTPServer#start: pid=11701 port=9292
{% endhighlight %}

__Giải thích hoạt động của ứng dụng trên:__

Ứng dụng này làm  một nhiệm vụ rất đơn giản, với tất cả các request, trả về respose là đoạn text "Hello from Rack!", cùng với response code 200.
Khi `rackup` ở trên, mặc định Rack sẽ dùng web server có sẵn của Ruby là WEBrick làm web server. Ở đây ta hoàn toàn có thể config để dùng các web server khác
như unicorn, puma, thin...

WEBrick sẽ lắng nghe ở cổng 9292. Khi dùng browser access vào địa chỉ: [http://localhost:9292](http://localhost:9292) ta sẽ thấy nội dung trả về là dòng text: "Hello from Rack!"

Khi WEBrick nhận request từ browser, nó sẽ gọi hàm `call` của class `SimpleRack` mà ta viết ở trên, truyền vào biến `env`, lấy nội dung trả về của hàm này để trả về cho browser.

Ta thử xem biến env này có nội dung như thế nào bằng cách trả về nội dung của `env` trong response như sau:

{% highlight ruby %}
# config.ru
class SimpleRack
  def self.call(env)
    [200,
      {"Content-Type" => "text/plain"},
      [env.inspect]
    ]
  end
end
{% endhighlight %}

Restart ứng dụng rack và request [http://localhost:9292](http://localhost:9292) ta thấy nội dung trả về chính là nội dung của biến env. Trong đó có một số key cần chú ý:

  - `PATH_INFO`: path của request. Mặc định sẽ là `/`
  - `QUERY_STRING`: params của request
  - `REQUEST_METHOD`: http method, GET, POST,...

Thử access bằng địa chỉ: [http://localhost:9292/index.php?id=1010](http://localhost:9292/index.php?id=1010) ta sẽ thấy các value tương ứng với các key trên:

  - `PATH_INFO`: /index.php
  - `QUERY_STRING`: id=1010
  - `REQUEST_METHOD`: GET

Ta thấy tất các các tham số liên quan đến request đều được gói trong biến env.

Thử chỉnh lại SimpleRack, trả về chuỗi `QUERY_STRING` xem sao!

{% highlight ruby %}
# config.ru
class SimpleRack
  def self.call(env)
    params = self.parse_param(env['QUERY_STRING'])
    params.map
    [200,
      {"Content-Type" => "text/plain"},
      ["Hello #{params['name']}"]
    ]
  end

  # input: "params1=value1&params2=value2"
  # output: {"params1" => "value1", "params2" => "value2"}
  def self.parse_param(query_string)
    Hash[*str.split(/[&=]/)] unless query_string.nil?
  end
end
{% endhighlight %}

Trong ví dụ trên, để tiện cho việc xử lý mình implement một hàm đơn giản để parse params từ dạng chuỗi sang dạng hash.

Dùng tham số `PATH_INFO` ta có thể implement một hàm routing đơn giản như sau:

{% highlight ruby %}
# config.ru
class SimpleRack
  def self.call(env)
    params = parse_param(env['QUERY_STRING'])
    
    body = routing(env['PATH_INFO'], params)

    [
      200,
      {"Content-Type" => "text/plain"},
      body
    ]
  end

  # input: "params1=value1&params2=value2"
  # output: {"params1" => "value1", "params2" => "value2"}
  def parse_param(query_string)
    Hash[*str.split(/[&=]/)] unless query_string.nil?
  end

  def routing(path, params)
    case(path)
    when 'index.html':
      ["You are at index.html page"]
    when 'login.html':
      ["You are at login.html page"]
    else
      ["Route not found!"]
    end
  end
end
{% endhighlight %}

__2. Rack middleware__

Sức mạnh của Rack middle nằm ở chỗ chúng ta có thể nối nhiều Rack application lại với nhau, ouput của Rack application sẽ là input của application khác. Việc này cung cấp tính mềm déo cho ứng dụng Rack, ta có thể thêm hoặc bớt các middleware theo ý mình mà không sợ ảnh hưởng đến middleware có sẵn.

Ví dụ điển hình nhất chính là Rails. Rails là một Rack application được tạo thành bởi nhiều Rack middleware. Chẳng hạn:

{% highlight ruby %}
Rails::Rack::Logger
ActiveRecord::QueryCache
ActionDispatch::Cookies
ActionDispatch::Session::CookieStore
ActionDispatch::ParamsParser
Rails.application.routes
{% endhighlight %}

Để hiểu rõ hơn, ta viết lại ứng dụng SimpleRack với 2 middleware như sau:

{% highlight ruby %}
# config.ru
class Logger
  def initialize
    @app = app
  end
  
  def call(env)
    status, header, body = @app.call(env)
    body.unshift("Info: This is log of Logger middleware\n")
    
    [status, header, body]
  end
end

class SimpleRack
  def self.call(env)
    [200,
      {"Content-Type" => "text/plain"},
      ["Hello from Rack!"]
    ]
  end
end

use Logger
run SimpleRack
{% endhighlight %}

Thứ tự thực hiện của ứng dụng Rack trên như sau:

```
Request --> WEBrick --> Logger --> SimpleRack --> Logger --> Browser
```

`Logger` sẽ pass request cho `SimpleRack` xử lý, `SimpleRack` xử lý xong trả response lại cho `Logger`, `Logger` append một dòng log vào response và trả response này về lại cho browser

Vì thế khi access địa chỉ [http://localhost:9292](http://localhost:9292) ta thấy ngoài nội dung "Hello from Rack!" còn thêm 1 dòng "Info: This is log of Logger middleware", dòng này chính là kết quả việc thực hiện middleware `Logger`.

Bên cạnh các chức năng cơ bản trên, Rack còn implement sẵn một số hàm helper như parse params, build response,... Chi tiết hơn có thể tham khảo ở document của Rack tại: [http://www.rubydoc.info/github/rack/rack](http://www.rubydoc.info/github/rack/rack)

Trên đây là những kiến thức căn bản về Ruby Rack. Hy vọng đã giúp mọi người hiểu rõ về nó.
