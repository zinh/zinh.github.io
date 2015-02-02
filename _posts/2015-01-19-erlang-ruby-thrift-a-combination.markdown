---
layout: post
title:  "Kết hợp Ruby và Erlang sử dụng Thrift"
date:   2015-02-01 00:03:04
summary: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
description: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
categories: ruby crawl
---

Trong bài viết trước, ta đã tìm hiểu cách xử lý concurrency đầu tiên thông qua multi-threading. Với một ứng dụng được viết cẩn thận, việc dùng multi-threading sẽ đem lại hiệu quả xử lý rất tốt. Tuy nhiên, đời ko như là mơ, code viết ra lúc nào cũng có lỗi. Ta lưu ý một đặc điểm của thread: share resource, hậu quả của nó chính là việc nhiều thread cùng truy xuất đồng thời tài nguyên(hay còn gọi là race condition), dẫn đến những trạng thái không lường trước được của chương trình. Một cách để giải quyết vấn đề race condition, như đã được đề cập trong bài trước chính là mutex. Tuy nhiên, dùng mutex không hợp lí rất có thể dẫn đến vấn đề tiếp theo: deadlock, đây là những sai sót rất dễ xảy ra khi lượng code tăng lên, và việc maintain rất khó khăn.

Here come actor model.

Actor model rất đơn giản, mỗi actor là một process, các actor hoạt động trong address space của riêng mình, không share resource với actor khác. Giữa các actor sẽ communicate với nhau thông qua cơ chế message(or mailbox).

http://www.scottlogic.com/blog/rdoyle/assets/ActorModel.png

Trong Ruby ta có thể áp dụng Actor model thông qua gem Celluloid. Tuy nhiên, do bị giới hạn bởi GIL nên trên thực tế, các actor không được chạy song song với nhau.

Trong bài viết này, ta sử dụng Erlang để minh họa cho Actor model.

Nhằm làm cho chương trình thêm phức tạp, mình chia ứng dụng thành 2 phần: phần HTTP request được implement bằng Erlang, phần parsing được implement bằng Ruby. 2 phần này được gắn với nhau thông qua Thrift, RPC được Facebook phát triển.

Tóm lại mô hình của ứng dụng crawler như sau:

Trước hết là phần HTTP request.

Process worker sẽ lấy link từ Process Link Queue(dùng chung cho tất cả worker). Mỗi khi lấy được link mới, worker sẽ gửi link này đến Link Queue để lên schedule crawl link đó. Để đơn giản, link queue thực hiện theo cơ chế FIFO(first in first out). Do đó Link Queue process sẽ nhận các message như sau:

Worker -(push, Link)-> Link Queue
Worker -(pop)-> Link Queue

[TODO] Paste code here(handle call, handle cast only)

Thrift

Cung cấp encode/decode data, protocol để trao đổi giữa các process khác nhau. 2 process liên lạc với nhau thông qua tcp socket.

File data structure của ứng dụng crawler như sau:

```thrift
# crawler thrift
```

File trên định nghĩa 1 structure và 1 hàm.

Hàm parse nhận vào tham số là structure WebData, thực hiện việc parse data và trả về cho client.

Để sinh ra file thư viện tương ứng với Erlang và Ruby ta thực hiện lệnh

```
thrift --gen rb crawler.thrift
thrift --gen erl crawler.thrift
```

Kết quả của lệnh trên là 2 thư mục `gen-rb` và `gen-erl`

### Implement parse process