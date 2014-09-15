---
layout: post
title:  "Giới thiệu về caching trong Rails"
date:   2014-09-15 00:03:04
summary: Giới thiệu sơ lược các loại hình caching được Rails hỗ trợ.
categories: rails
---

Caching chính là một công cụ lợi hại để tối ưu hoá tốc độ của một ứng dụng web. Nếu được sử dụng đúng cách, thích hợp, caching sẽ giúp tăng tốc độ
load trang lên một cách rất đáng kể.

Caching có rất nhiểu loại, ở nhiều tầng khác nhau. Từ Browser cache, server header(ETag), đến server cache.

Trong phạm vi bài này ta sẽ đề cập đến server Cache và cách tích hợp cùng với Rails.

__1. Các loại hình caching trong Rails__

Theo tài liệu của Rails, hiện tại, Rails hỗ trợ các kiểu cache như sau:

  - Page caching

  - Action caching

  - Fragment caching

  - SQL caching

__2. Chi tiết__

2.1. Page Caching: cache toàn bộ một page. Toàn bộ HTML của trang được cache sẽ được lưu vào một file html ở thư mục public. Do đó khi request lại trang này, Rails sẽ trả về trang html đó mà không phải qua bất cứ xử lý nào của các middleware, controller. Do đó có thể nói page caching cho tốc độ nhanh nhất, nhưng cũng ít tùy biến nhất.

2.2. Action caching caching: một đặc điểm của page caching chính là page được cache không phải qua bất cứ xử lý nào của các rack middleware, controller. Tuy nhiên không phải lúc nào cũng làm được việc đó.

2.3. Fragment: giúp cache một phần của views

2.4. SQL caching: giúp cách kết quả trả về của một câu SQL query
