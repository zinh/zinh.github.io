---
layout: post
title:  "Kết hợp Ruby và Erlang sử dụng Thrift"
date:   2015-01-06 00:03:04
summary: Tiếp theo loạt series về các cấu trúc xử lý concurrency, trong bài viết này mình xin giới thiệu Actor Model cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
description: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này mình xin giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
categories: ruby crawl
---

Trong bài viết trước, ta đã tìm hiểu cách xử lý concurrency đầu tiên thông qua multi-threading. Với một ứng dụng được viết cẩn thận, việc dùng multi-threading sẽ đem lại hiệu quả xử lý rất tốt.
Đặc điểm của thread: share resource, hậu quả của nó chính là race condition xảy ra khi nhiều thread cùng truy xuất đồng thời tài nguyên. Một cách để giải quyết vấn đề race condition, như đã được đề cập trong bài trước chính là mutex. Tuy nhiên, dùng mutex không hợp lí rất có thể dẫn đến vấn đề tiếp theo: deadlock, đây là những sai sót rất dễ xảy ra khi lượng code tăng lên, và việc maintain rất khó khăn.

Here come actor model.

Actor model rất đơn giản, mỗi actor là một process, các actor hoạt động trong address space của riêng mình, không share state với actor khác.
Giữa các actor sẽ communicate với nhau thông qua cơ chế message(or mailbox).

Trong Ruby ta có thể áp dụng Actor model thông qua gem Celluloid. Tuy nhiên, do GIL nên trên thực tế, các actor không được chạy song song với nhau.

Trong bài viết này, mình sử dụng Erlang để minh họa cho Actor model.

Tuy nhiên, do mới làm quen với Erlang cũng không lâu, nên mấy tác vụ xử lý chuỗi, xpath chưa được quen lắm. Vì thế mình sẽ để 1 phần code xử lý html nằm ở bên Ruby. Erlang chỉ có nhiệm vụ request html.

Có nhiều cách để kết hợp Ruby với Erlang(và các ngôn ngữ khác) như AMQP(rabbitmq, zeromq), RPC. Để cho đơn giản, mình sẽ dùng một ứng dụng RPC: Thrift.

Tóm lại mô hình của ứng dụng crawler như sau:

