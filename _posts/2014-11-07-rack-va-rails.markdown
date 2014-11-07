---
layout: post
title:  "Rack và Rails"
date:   2014-11-07 23:55:00
summary: Tiếp theo bài giới thiệu về Ruby Rack trước, bài viết này sẽ đi sâu vào phân tích ứng dụng của Rack trong Rails.
categories: ruby rails
---

Tiếp theo [bài viết trước](http://zinh.github.io/ruby/2014/10/16/gioi-thieu-ruby-rack.html), trong bài này mình sẽ đi sâu vào phân tích ứng dụng của Rack với framework Rails.

Như chúng ta đã biết, Rails là một framework sử dụng Rack middleware. Một request để đến được controller, model, view đã qua xử lý của rất nhiều Rack Middleware. Theo [document](http://guides.rubyonrails.org/rails_on_rack.html#inspecting-middleware-stack){:target="_blank"}{:rel="nofollow"} của Rails, mặc định, các Rack Middleware sau được sử dụng để xử lý request:

{% highlight bash %}
$ bin/rake middleware

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

Để hiểu rõ hơn, ta thử phân tích một số Rack Middleware đơn giản.

#### Rack::Sendfile

Trước tiên một request sẽ qua middleware `Rack::Sendfile`. Thực chất đây là một middleware được cung cấp sẵn trong thư viện Rack. Để biết được middleware này giữ nhiệm vụ gì, ta tham khảo source của Rack tại [Github]( https://github.com/rack/rack/blob/master/lib/rack/sendfile.rb){:target="_blank"}{:rel="nofollow"}

Code của class `Sendfile` khá ngắn nên không quá khó hiểu. Như trong [bài viết trước](http://zinh.github.io/ruby/2014/10/16/gioi-thieu-ruby-rack.html), một ứng dụng rack middleware sẽ implement một hàm `call`. Hàm này nhận vào biến `env` và trả về mảng `[status, headers, body]`. Trước tiên hàm `call` của `Sendfile` sẽ gọi:

{% highlight ruby %}
def call(env)
  status, headers, body = @app.call(env)
  ...
end
{% endhighlight %}

Đây là lệnh gọi xử lý của các middleware phía sau. Sau khi các middleware khác đã được xử lý xong, `SendFile` sẽ giữ nhiệm vụ lấy chuỗi `to_path` từ biến body và trả về file tương ứng. Điều này được thể hiện trong đoạn code:

{% highlight ruby %}
def call(env)
   ...
   if body.respond_to?(:to_path)
     path = F.expand_path(body.to_path)
     headers[type] = path
   end

   [status, headers, body]
end
{% endhighlight %}

Tóm lại chức năng của middleware Sendfile là lấy chuỗi `to_path` từ `body` và append vào response header. Các web server bên dưới như nginx, apache khi nhận được response header này sẽ đọc file được chỉ ra ở đường dẫn `to_path` và trả về cho client. Điều này giúp cho ứng dụng Rails app đỡ phải xử lý các tác vụ đọc file trong trường hợp kết quả trả về là nội dung của một file static.

#### ActionDispatch::Static

Code của class static tham khảo tại [Github](https://github.com/rails/rails/blob/master/actionpack/lib/action_dispatch/middleware/static.rb#L97){:target="_blank"}{:rel="nofollow"}

{% highlight ruby %}
def call(env)
  case env['REQUEST_METHOD']
  when 'GET', 'HEAD'
    path = env['PATH_INFO'].chomp('/')
    if match = @file_handler.match?(path)
      env["PATH_INFO"] = match
      return @file_handler.call(env)
    end
  end
  @app.call(env)
end
{% endhighlight %}

Ta thấy chức năng của middleware này rất đơn giản, nếu biến request header có biến `PATH_INFO`, middleware này sẽ đọc file được chỉ ra ở biến `PATH_INFO` trong thư mục root(thông thường là thư mục `public`) và trả về cho client. Nếu không tìm thấy file hoặc không có header `PATH_INFO` request sẽ được forward đến các middleware phía sau để xử lý tiếp.


#### ActionDispatch::RequestId

Sau khi đi qua 2 middleware khác(`Rack::Lock` và `Cache`), đến lược class `RequestId` được gọi. [Github](https://github.com/rails/rails/blob/master/actionpack/lib/action_dispatch/middleware/request_id.rb){:target="_blank"}{:rel="nofollow"}

{% highlight ruby %}
def call(env)
  env["action_dispatch.request_id"] = external_request_id(env) || internal_request_id
  @app.call(env).tap { |_status, headers, _body| headers["X-Request-Id"] = env["action_dispatch.request_id"] }
end
{% endhighlight %}

Middleware này có giữ nhiệm vụ set header `X-Request-Id`, header này được sinh ngẫu nhiên(sử dụng class `SecureRandom`)

Như vậy ta thấy để đến được bước xử lý của code controller, model, view. Một request đã đi ra rất nhiều bước tiền xử lý. Ở danh sách các middleware mặc định ở trên, ta để ý thấy dòng cuối cùng:

```ruby
run Rails.application.routes
```

Đây chính là lúc request đi vào xử lý routing của ứng dụng Rails. Lúc này request sẽ được đưa đến các controller, model, view tương ứng.

#### Thêm, xóa một middleware

Chính cấu trúc module của Rack middleware giúp ta dễ dàng thêm hoặc bớt một middleware bất kỳ. Chẳng hạn, muốn thêm một middleware ta config trong file `application.rb`:

{% highlight ruby %}
# config/application.rb
# chèn middleware vào cuối middleware stack
config.middleware.use(new_middleware, args)

# chèn middleware vào trước một middleware có sẵn
config.middleware.insert_before(existing_middleware, new_middleware, args) 

# chèn middleware vào sau một middleware có sẵn
config.middleware.insert_after(existing_middleware, new_middleware, args) 
{% endhighlight %}

Hoặc để xóa một middleware có sẵn ta config như sau(cũng trong file `application.rb`)

{% highlight ruby %}
# config/application.rb
config.middleware.delete "Rack::Lock"
{% endhighlight %}

Để hiểu chi tiết hơn về các middleware khác, ta có thể tham khảo ở các địa chỉ sau:

[Rails guide](http://guides.rubyonrails.org/rails_on_rack.html#internal-middleware-stack){:target="_blank"}{:rel="nofollow"}

[Rails source code](https://github.com/rails/rails){:target="_blank"}{:rel="nofollow"}
