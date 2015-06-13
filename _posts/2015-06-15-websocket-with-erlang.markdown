---
layout: post
title:  "Websocket với Erlang"
date:   2015-06-15 00:03:04
summary: Trong bài viết này mình tìm hiểu về Websocket thông qua việc viết server Websocket dùng Erlang.
description: Viết thư viện Websocket bằng Erlang
categories: erlang
---

## Giới thiệu về giao thức Websocket

Chung cổng http 80.
Dùng HTTP Header để thực hiện handshake.
Sau khi handshake thành công, dữ liệu sẽ được gửi qua lại thông qua các packet được gọi là frame.
Các frame này không còn tuân theo format của HTTP packet.
Hiện được hỗ trợ trong hầu hết các trình duyệt thông dụng.

## Hiện thực bước handshake

## Nhận message từ client

## Gửi message đến client

## Tham khảo

https://tools.ietf.org/html/rfc6455
