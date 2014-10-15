---
layout: post
title:  "Giới thiệu Ruby Rack"
date:   2014-10-01 23:55:00
summary: Giới thiệu Ruby Rack.
categories: ruby
---

Trong giao thức http ta có request và response. Client(Browser) gửi request đến server mà chờ response từ server.
Thông thường khi server nhận được một http request sẽ không trả về response ngay mà chuyển request đó đến các lớp xử lý
phía sau.

Ví dụ trong một ứng dụng Rails, request sẽ được web server(nginx, apache...), web server có thể trả về response nếu tài
nguyên yêu cầu là tài nguyên tĩnh(images, videos,...), vói các nội dung động, web server sẽ chuyển request này đến ứng dụng Rails.
Đến lượt ứng dụng Rails này xử lý request và trả response về web server, web server trả response về client.

Rack là một thư viện được viết bằng Ruby, giúp đơn giản hóa việc xử lý http request/response.

__1. Ứng dụng Rack đơn giản__

Một Rack application có cấu trúc rất đơn giản: nó là một Ruby Object, định nghĩa hàm call. Hàm call này có tham số là một request và trả về response.

Ta thử viết một Rack application đơn giản như sau:

Tạo file `config.ru` có nội dung như sau:

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

Để chạy ứng dụng trên ta dùng lệnh
{% highlight bash %}
$ rackup
[2014-10-14 18:07:27] INFO  WEBrick 1.3.1
[2014-10-14 18:07:27] INFO  ruby 2.1.2 (2014-05-08) [x86_64-linux]
[2014-10-14 18:07:27] INFO  WEBrick::HTTPServer#start: pid=11701 port=9292
{% endhighlight %}

Giải thích hoạt động của ứng dụng trên:

Ứng dụng này làm  một nhiệm vụ rất đơn giản, với tất cả các request, trả về respose là đoạn text "Hello from Rack!", cùng với response code 200.
Khi `rackup` ở trên, mặc định Rack sẽ dùng web server có sẵn của Ruby là WEBrick làm web server. Ở đây ta hoàn toàn có thể config để dùng các web server khác
như nginx, apache...

WEBrick sẽ lắng nghe ở cổng 9292. Khi dùng browser access vào địa chỉ: http://localhost:9292 ta sẽ thấy nội dung trả về là dòng text: "Hello from Rack!"
Khi WEBrick nhận request từ browser, nó sẽ gọi hàm call của SimpleRack mà ta viết ở trên, truyền vào biến env, lấy nội dung trả về của hàm này để trả về cho browser.

Ta thử xem biến env này có nội dung như thế nào bằng cách trả về nội dung của env trong response như sau:


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

Restart ứng dụng rack và request http://localhost:9292 ta thấy nội dung trả về chính là nội dung của biến env. Trong đó có một số key cần chú ý:

  - `PATH_INFO`: path của request. Mặc định sẽ là `/`
  - `QUERY_STRING`: params của request
  - `REQUEST_METHOD`: http method, GET, POST,...

Thử access bằng địa chỉ: http://localhost:9292/index.php?id=1010 ta sẽ thấy các value tương ứng với các key trên:

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

Trong ví dụ trên, để tiện cho việc xử lý mình immplement một hàm đơn giản để parse params từ dạng chuỗi sang dạng hash.

Tiếp theo mình sẽ gắn chức năng routing cho nó. Để đơn giản mình dùng một hàm switch để xét các route. Thông tin về path được lưu trong key `PATH_INFO` của biến env.

{% highlight ruby %}
# config.ru
class SimpleRack
  def self.call(env)
    params = self.parse_param(env['QUERY_STRING'])
    
    routing(env['PATH_INFO'], params)

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

  def routing(path, params)
    case(path)
    when 'index.html':
    when 'login.html':
    else
    end
  end
end
{% endhighlight %}

__2. Rack middleware__

Sức mạnh của Rack middle nằm ở chỗ chúng ta có thể nối nhiều Rack application lại với nhau, ouput của Rack application sẽ là input của application khác. Việc này cung cấp t ính mềm déo cho ứng dụng Rack, ta có thể thêm hoặc bớt các middleware theo ý mình mà không sợ ảnh hưởng đến middleware có sẵn.

Ví dụ điển hình nhất chính là Rails. Rails là một Rack application được tạo thành bởi nhiều Rack middleware. Chẳng hạn:

{% highlight ruby %}
Rails::Rack::Logger
ActiveRecord::QueryCache
ActionDispatch::Cookies
ActionDispatch::Session::CookieStore
ActionDispatch::ParamsParser
Rails.application.routes
{% endhighlight %}

Ta viết lại ứng dụng SimpleRack với 2 middleware như sau:
Code:

{% highlight ruby %}
# config.ru

class Logger
  def initialize
    @app = app
  end
  
  def call(env)
    status, header, body = @app.call(env)
    body.unshift("#{Time.now} Info: This is log of Logger middleware\n")
    
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
Request --> Logger --> SimpleRack --> Logger --> Browser
```

Logger sẽ pass request cho `SimpleRack` xử lý, `SimpleRack` xử lý xong trả response lại cho `Logger`, `Logger` append một dòng log vào response và trả response này về lại cho browser.

Trở lại một chút với Rack Middleware của Rails, ta có thể dùng lệnh `rack middleware` để liệt kê tất cả các Rack Middleware  của một ứng dụng Rails. Mặc định sẽ các có middleware sau:

{% highlight ruby %}
use Rack::Sendfile
use ActionDispatch::Static
use Rack::Lock
use #<ActiveSupport::Cache::Strategy::LocalCache::Middleware:0x000000029a0838>
use Rack::Runtime
use Rack::MethodOverride
use ActionDispatch::RequestId
use Rails::Rack::Logger
use ActionDispatch::ShowExceptions
use ActionDispatch::DebugExceptions
use ActionDispatch::RemoteIp
use ActionDispatch::Reloader
use ActionDispatch::Callbacks
use ActiveRecord::Migration::CheckPending
use ActiveRecord::ConnectionAdapters::ConnectionManagement
use ActiveRecord::QueryCache
use ActionDispatch::Cookies
use ActionDispatch::Session::CookieStore
use ActionDispatch::Flash
use ActionDispatch::ParamsParser
use Rack::Head
use Rack::ConditionalGet
use Rack::ETag
run Rails.application.routes
{% endhighlight %}

Ta thấy để một request đến được tầng xử lý của Controller đã qua rất nhiều middleware khác nhau.

Mình sẽ dành việc đi sâu vào các middleware này trong một bài blog khác. Các bạn cũng có thể tham khảo
về các middleware này tại địa chỉ: [http://guides.rubyonrails.org/rails_on_rack.html](http://guides.rubyonrails.org/rails_on_rack.html)
