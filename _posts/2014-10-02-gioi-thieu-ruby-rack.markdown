---
layout: post
title:  "Giới thiệu Ruby Rack"
date:   2014-10-01 23:55:00
summary: Giới thiệu Ruby Rack.
categories: ruby
---

Trong mô hình http ta có request và response. Client(Browser) gửi request đến server mà chờ response từ server.
Đương nhiên khi server nhận được một http request sẽ trả về response ngay mà chuyển request đó đến các lớp xử lý
phía sau.

Ví dụ trong một ứng dụng Rails, request sẽ được web server nhận(nginx, apache...), sau đó chuyển request này đến ứng dụng
Rails. Đến lượt ứng dụng Rails này xử lý request và trả response về web server, web server trả response về client.

Rack là một thư viện được viết bằng Ruby, giúp đơn giản hóa việc xử lý http request/response.

__1. Một ứng dụng Rack đơn giản:__

