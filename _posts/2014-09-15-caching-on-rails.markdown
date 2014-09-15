---
layout: post
title:  "Caching và Rails"
date:   2014-09-15 00:03:04
summary: This summary about something
categories: rails
---

Cache là một chức năng cần lưu ý khi phát triển một ứng dụng web. Nếu được sử dụng đúng cách, thích hợp sẽ giúp tăng tốc độ
load trang lên một cách rất đáng kể.

Caching có rất nhiểu loại, ở nhiều tầng khác nhau. Từ Browser cache, server header(ETag), đến server cache.

Trong bài này ta sẽ đề cập đến server Cache và cách integrate cùng với Rails.

__1. Các loại hình caching trong Rails__

Theo tài liệu của Rails, hiện tại, Rails hỗ trợ các kiểu cache như sau:

  - Page caching

  - Action caching

  - Fragment caching

  - SQL caching

__2. Chi tiết__

2.1. Page Caching: cache toàn bộ một page. Ví dụ: index

2.2. Action caching caching: cache một action nào đó. Khác biệt với page caching ở chỗ các callback như before\_action, before\_filter vẫn được thưc hiện.
Vì thế các trang cần phải login vẫn hoạt động bình thường.

2.3. Fragment: giúp cache một phần của views

2.4. SQL caching: giúp cách kết quả trả về của một câu SQL query
