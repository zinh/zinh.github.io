---
layout: post
title:  "Rack và Rails"
date:   2014-11-07 23:55:00
summary: Tiếp theo bài giới thiệu về Ruby Rack trước, bài viết này sẽ đi sâu vào phân tích ứng dụng của Rack với Rails.
categories: ruby, rails
---

Như chúng ta đã biết, Rails là một framework sử dụng Rack middleware. Một request để đến được controller và model đã qua xử lý của rất nhiều Rack Middleware. Theo document của Rails, mặc định, các Rack Middleware sau được sử dụng để xử lý các request:

```bash
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
```

Ta thử phân tích một số Rack Middleware. Trước tiên một request sẽ qua middleware `Rack::Sendfile`. Thực chất đây là một middleware được cung cấp sẵn trong thư viện Rack. Để biết được middleware này giữ nhiệm vụ gì, ta tham khảo source của Rack tại https://github.com/rack/rack/blob/master/lib/rack/sendfile.rb.

Code của class Sendfile khá ngắn nên không quá khó hiểu. Như trong bài trước, một ứng dụng rack middleware sẽ immplement một hàm `call`. Hàm này nhận vào biến env và trả về mảng `[status, headers, body]`. Trước tiên hàm `call` sẽ gọi

```ruby
status, headers, body = @app.call(env)
```

Đây là lệnh gọi xử lý của các middleware phía sau. Sau khi các middleware khác đã xử lý xong, SendFile sẽ giữ nhiệm vụ lấy chuỗi to_path từ biến body và trả về file tương ứng. Điều này được thể hiện trong đoạn code:

```ruby
if body.respond_to?(:to_path)
  path = F.expand_path(body.to_path)
  headers[type] = path
end

return [status, headers, body]
```

Tóm lại chức năng của middleware Sendfile là lấy chuỗi `to_path` từ `body` và append vào response header. Các web server bên dưới như nginx, apache khi nhận được response header này sẽ đọc file được chỉ ra ở đường dẫn `to_path` và trả về cho client. Điều này giúp cho ứng dụng Rails app đỡ phải xử lý trong trường hợp kết quả trả về là nội dung của một file static.

### ActionDispatch::Static

