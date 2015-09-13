---
layout: post
title:  "Thu thập dữ liệu từ website cùng với Ruby, phần 3"
date:   2015-09-12 00:03:04
summary: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu Reactor pattern cùng với việc áp dụng pattern này vào ứng dụng crawler thông qua gem EventMachine.
description: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu Reactor pattern cùng với việc áp dụng pattern này vào ứng dụng crawler thông qua gem EventMachine.
categories: ruby crawl
---

[Phần 1: Crawler sử dụng mô hình thread-pool](/ruby/crawl/2015/01/06/crawl-data-using-ruby.html)

[Phần 2: Crawler sử dụng pattern Actor](/ruby/crawl/2015/09/07/crawl-data-using-ruby-and-erlang.html)

Tiếp theo loạt bài về concurrency trong Ruby, trong bài viết này(cũng là bài viết cuối cùng) mình xin trình bày về pattern Reactor cùng với cách sử dụng Reactor trong Ruby với hỗ trợ của thư viện EventMachine.

### 1. Reactor là gì?

Cấu trúc của Reactor thường có 3 phần:

- Synchronous Event Demultiplexer: vòng lặp để nhận các event(có thể là IO Event, message, request).
- Dispatcher: có tác dụng gửi các event này đến các Event Handler tương ứng.
- Event Handler: phần xử lý cho từng event(hay còn gọi là callback)


Mục đích của việc áp dụng Reactor nhằm tránh tạo quá nhiều thread cho từng connection/request/message. Nói nôm na, Reactor giúp ta có thể xử lý concurrent chỉ với mô hình single-threaded(do đó tránh được những vấn đề phát sinh đã được đề cập đến trong phần 2).

Hiện tại, Reactor được implement trong hầu hết các ngôn ngữ lập trình, như Javascript(với hệ thống callback, promise), C với thư viện libevent...

Trong Ruby, thư viện Reactor pattern được biết đến nhiều nhất chính là EventMachine. Sau đây ta sẽ tìm hiểu cách sử dụng EventMachine.

### 2. EventMachine 101

Cài đặt EventMachine tương tự như các gem khác của Ruby:

    gem install eventmachine

Synchronous Event Demultiplexer:

    EventMachine.run do
      EventMachine.start_server ...
    end

Request Handler:

    module Echo
      def receive_data(data)
        p data
      end
    end

Hoặc định nghĩa trong một class:

    class Echo < EventMachine::Connection
      def initialize(*args)
        super
      end

      def receive_data(data)
        p data
      end
    end

    EventMachine.connect '127.0.0.1', 22, Echo

Một điểm quan trọng cần lưu ý, do chỉ chạy trên single-thread, nên khi Request Handler được thực thi, cả chương trình sẽ bị block cho đến khi Request Handler kết thúc. Vì thế cần giảm thiểu thời gian chạy của Request Handler đến mức tối đa, đặc biệt là các tác vụ IO(như đọc, ghi File, HTTP request, ...) không nên để trực tiếp trong Request Handler. Thay vào đó ta nên sử dụng library non-blocking IO tương ứng với các tác vụ trên.

Chẳng hạn để gọi HTTP Request trong Request Handler, ta có thể dùng library `em-http-request`

Danh sách các thư viện non-blocking tương thích với EventMachine được liệt kê khá đầy đủ ở link sau:

[https://github.com/eventmachine/eventmachine/wiki/Protocol-Implementations](https://github.com/eventmachine/eventmachine/wiki/Protocol-Implementations)

### 3. Sử dụng EventMachine trong chương trình crawler

Trong phần này ta thử áp dụng EventMachine trong ứng dụng crawler, với hỗ trợ của gem `em-http-request`

Tương tự như phần 1, cấu trúc cơ bản của chương trình như sau:

    class Crawler
      def initialize
        @links = []
        @crawled = []
        @crawling = []
      end
    
      def crawl
        # main code
      end
    
      private
      def push_link(doc)
      end
    end

Trước hết là phần xử lý của EventMachine

    def crawl
      EventMachine.run{
        while true
          link = next_link
          next if link.nil?
          http = EventMachine::HttpRequest.new(link).get
          http.errback{}
          http.callback{}
        end
      }
    end
