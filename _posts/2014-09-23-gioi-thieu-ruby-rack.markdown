---
layout: post
title:  "Giới thiệu Ruby Rack"
date:   2014-09-23 00:03:04
summary: Giới thiệu về Rack cùng một số ứng dụng đơn giản.
categories: ruby
---

Trong mô hình http ta có request và response. Client(Browser) gửi request đến server mà chờ response từ server.
Đương nhiên khi server nhận được một http request sẽ trả về response ngay mà chuyển request đó đến các lớp xử lý
phía sau.

Ví dụ trong một ứng dụng Rails, request sẽ được web server nhận(nginx, apache...), sau đó chuyển request này đến ứng dụng
Rails. Đến lượt ứng dụng Rails này xử lý request và trả response về web server, web server trả response về client.
