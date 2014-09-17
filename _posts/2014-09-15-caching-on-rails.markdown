---
layout: post
title:  "Giới thiệu về caching trong Rails"
date:   2014-09-15 00:03:04
summary: Loạt bài nhiều phần này nhằm giới thiệu từ tổng quan đến chi tiết, cũng như cách cài đặt sử dụng các loại hình caching trong Rails. Trong phần đầu, mình xin giới thiệu sơ lược về caching trong Rails.
categories: rails
---

Caching chính là một công cụ lợi hại để tối ưu hoá tốc độ của một ứng dụng web. Nếu được sử dụng đúng cách, thích hợp, caching sẽ giúp tăng tốc độ
load trang lên một cách rất đáng kể.

Caching có rất nhiểu loại, ở nhiều tầng khác nhau. Từ Browser cache, server header(ETag), đến server cache.

Trong phạm vi bài này mình sẽ giới thiệu về các loại hình caching ở tầng Web server được Rails hỗ trợ.

__1. Các loại hình caching trong Rails__

Theo tài liệu của [Rails](http://guides.rubyonrails.org/caching_with_rails.html), hiện tại, Rails hỗ trợ các kiểu cache như sau:

  - Page caching

  - Action caching

  - Fragment caching

  - SQL caching
  
  - Raw caching

__2. Chi tiết__

2.1. Page Caching: cache toàn bộ một page. Toàn bộ HTML của trang được cache sẽ được lưu vào một file html ở thư mục public. Do đó khi request lại trang này, Rails sẽ trả về trang html đó mà không phải qua bất cứ xử lý nào của các middleware, controller. Do đó có thể nói page caching cho tốc độ nhanh nhất, nhưng cũng ít tùy biến nhất.Tuy nhiên do không qua xử lý của middle, controller các chức năng như authenticate sẽ không sử đụng được.

2.2. Action caching caching: để khắc phục nhược điểm của page caching, ta có thể sử dụng Action Caching. Kết quả xử lý của một action sẽ được cache lại. Khi có request gọi đến một action đã được cache, request đó vẫn qua các middleware của Rails, vẫn được xử lý bởi các hàm hook như before_filter, do đó Action caching rất thuận tiện những trường hợp như bạn muốn cache một trang cần phải được login mới xem được, hoặc dùng song song với các gem authenticate như [Devise](https://github.com/plataformatec/devise). Xét về tốc độ thì đương nhiên Action caching sẽ chậm hơn Page caching.

2.3. Fragment: giúp cache một phần của views. Ở đây request gọi đến vẫn được thông qua action xử lý bình thường, chỉ đến lúc sinh HTML ta mới cache lại một phần nào đó. Một ví dụ điển hình nhất là ta thường cache lại các static content của một trang như banner, menu, sidebar… và nội dung chính của trang vẫn được generate động. Fragment caching linh động hơn, do đó cũng sẽ chậm hơn Action caching(do vẫn phải qua controller xử lý).

2.4. SQL caching: mặc định khi dùng ActiveRecord nếu ta gọi cùng một câu query nhiều lần thì chỉ có lần đầu tiên Rails thực hiện query đến Database và cache kết quả trả về lại. Các lần gọi kế tiếp sẽ không cần phải connect đến database.

2.5. Raw caching: ngoài các loại hình caching cung cấp sẵn, Rails còn có các hàm dựng sẵn dùng cho việc đọc/ghi một giá trị từ cache. Ta có thể dùng nó để cache lại giá trị của một biến nào đó. Hoặc cũng có thể dùng nó để cache lại kết quả của API...

Trên đây là sơ lược về Caching trong Rails. Trong các bài kế tiếp, mình sẽ giới thiệu chi tiết hơn về cách sử dụng cũng như ưu khuyết điểm của từng loại.
