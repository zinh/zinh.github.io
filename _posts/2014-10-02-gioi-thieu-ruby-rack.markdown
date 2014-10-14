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

__1. Rack application là gì?__

Một Rack application có cấu trúc rất đơn giản: nó là một Ruby Object, định nghĩa hàm call. Hàm call này có tham số là một request và trả về response.

Ta thử viết một Rack application đơn giản như sau:

Tạo file `config.ru` có nội dung như sau:

```ruby
# config.ru
class SimpleRack
  self.call(env)
    [200,
      {"Content-Type" => "text/plain"},
      ["Hello from Rack!"]
    ]
  end
end
```
