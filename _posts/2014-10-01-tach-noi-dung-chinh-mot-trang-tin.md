---
layout: post
title:  "Tách nội dung chính của một trang tin tức"
date:   2014-09-23 00:03:04
summary: Trong bài viết này mình xin trình bày một thuật toán để tách nội dung chính của một trang web(tin tức).
categories: ruby
---

Vấn đề: với một người rất hay đọc báo/blog online như mình, chức năng Reader của Safari rất hữu dụng.
Chức năng này rất đơn giản, mỗi khi bạn truy cập vào một trang web nào đó(chủ yếu là trang web về tin tức),
khi bạn dùng Reader nội dung chính của trang web sẽ được hiển thị riêng ra, các phần khác như menu, quảng cáo...
đều bị ẩn đi, font chữ được phóng to lên, giúp cho bạn tập trung vào bài báo.

Tuy nhiên, một nhược điểm của Reader là chỉ có Safari mới có, nghĩa là phải dùng Mac hoặc iOS thì mới dùng được.
Chuyển qua Linux thì bó tay. Vì vậy mình thử viết một ứng dụng web nho nhỏ để giải quyết vấn đề này xem sao.

Yêu cầu: một trang web đơn giản, cho nhập vào địa chỉ một bài báo, một link blog, ứng dụng sẽ tự động lấy nội
dung của trang web đó về, tách bỏ các phần râu ria đi, chi hiển thị nội dung chính của bài báo đó.

Đến đây thì có 2 hướng giải quyết:

  1. Dùng một số đánh giá Heuristic đơn giản để lựa ra phần có nội dung có vẻ là nội dung chính nhất.
  2. Dùng Machine Learning/Statistic: cho một số pattern mẫu vào training set, dùng các thuật toán Supervised
  Learning để giúp nhận dạng được các pattern khác.
  
Cách 2 có vẻ khoai, nên thử cách 1 trước xem sao!

