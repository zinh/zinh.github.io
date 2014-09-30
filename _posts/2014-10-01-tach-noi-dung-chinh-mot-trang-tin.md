---
layout: post
title:  "Tách nội dung chính của một trang tin tức"
date:   2014-10-01 23:55:00
summary: Trong bài viết này mình xin trình bày một thuật toán để tách nội dung chính của một trang web(tin tức).
categories: ruby
---

__Vấn đề:__ với một người rất hay đọc báo/blog online như mình, chức năng Reader của Safari rất hữu dụng.
Chức năng này rất đơn giản, mỗi khi bạn truy cập vào một trang web nào đó(chủ yếu là trang web về tin tức),
khi bạn dùng Reader, nội dung chính của trang web sẽ được hiển thị riêng ra, các phần khác như menu, quảng cáo...
đều bị ẩn đi, font chữ được phóng to lên, giúp cho bạn tập trung vào bài báo dễ dàng hơn.

![Demo Safari Reader](http://i.i.cbsi.com/cnwk.1d/i/tim//2010/06/09/SafariReaderActive.png)

Tuy nhiên, một nhược điểm của Reader là chỉ có Safari mới có, nghĩa là phải dùng Mac hoặc iOS thì mới dùng được.
Chuyển qua Linux, hoặc dùng các trình duyệt khác thì bó tay. Vì vậy mình thử viết một ứng dụng web nho nhỏ để giải quyết vấn đề này xem sao.

__Yêu cầu:__ một ứng dụng web đơn giản, cho nhập vào địa chỉ một bài báo(hay một link blog), ứng dụng sẽ tự động lấy nội dung của trang web đó về, tách bỏ các phần râu ria đi, chi hiển thị nội dung chính của bài báo đó.

Đây là ứng dụng mình demo trên Heroku, dùng Ruby on Rails, cùng với thư viện parse XML Nokogiri.

http://newslook.herokuapp.com

link một bài báo sau khi đã tách được nội dung chính:

http://newslook.herokuapp.com/read?url=http%3A%2F%2Fdulich.tuoitre.vn%2Ftin%2F20140929%2Fdi-tren-nhung-cay-cau-ky-la-nhat-the-gioi%2F651937.html

Trở lại vấn đề, mình có 2 hướng giải quyết:

  1. Dùng một số đánh giá Heuristic đơn giản để lựa ra phần có nội dung có vẻ là nội dung chính nhất.
  2. Dùng Machine Learning/Statistic: cho một số pattern mẫu vào training set, dùng các thuật toán Supervised
  Learning để giúp nhận dạng được các pattern khác.
  
Cách 2 có vẻ khoai, nên thử cách 1 trước xem sao!

Trước hết ta có quan sát đơn giản như sau:

*Quan sát 1:* Nội dung chính thường chứa nhiều text hơn link.
Điều này khá hiển nhiên, nội dung chính mà chỉ toàn link, kèm theo vài đoạn text thì chắc là spam rồi.

Trước khi đi vào thuật toán, mình xin nhắc lại một chút về HTML.

*Một tài liệu HTML(hay XML) có thể biểu diễn thành dạng cây, với mỗi một node là thẻ HTML.*

![HTML tree](http://lwp.interglacial.com/figs/plwp_0901.gif)

Từ quan sát trên ta phát thảo một thuật toán như sau:

__B 1:__ Duyệt qua từng node trong cây.

__B 1.1:__ Với mỗi node thứ N ta gọi:

    text(N) = text trong N, và các con của N
    link(N) = tất cả các link thuộc node N(bao gồm cả node con, node cháu...)
  
__B 1.2:__ Ta tính tỉ lệ giữa link và text bằng công thức:

    radio(N) = [text(N) - link(N)] / text(N)
  
__B 1.3:__ Node có radio lớn nhất chính là node cần tìm.

Thuật toán rất đơn giản! Tuy nhiên có môt nhược điểm rất lớn ở đây: thuật toán có khuynh hướng lấy các node chỉ
toàn text và không chứa bất cứ link nào, khi đó node đó sẽ có radio = 1(lớn nhất!). Ví dụ một node có radio = 1

    <p>This node will have a radio of 1<p>
    
Vì thế, ta có một cải tiến nho nhỏ như sau:

*Cải tiến 1*: thay vì chỉ đánh giá radio(N) theo text và link, ta đánh giá thêm một tham số nữa: tỉ lệ text chứa
trong node N trên toàn bộ text của trang web. Khi đó công thức tính radio của ta sẽ trở thành:

    radio(N) = p * [text(N) - link(N)] / text(N) + q * text(N) / total_text
    Trong đó để đảm bảo radio thuộc khoang [0,1] ta ràng buộc p + q = 1
    
Ta cần điều chỉnh p, q sao cho ra kết quả chính xác nhất. Có thể đánh giá dựa trên các tỉ lệ precision, recall, ... Hiện tại mình đang dùng p = 0.99, q = 0.01

Đến đây thì thuật toán của ta cũng gần gần hoàn thiện, nếu tinh chỉnh hệ số p, q thích hợp độ chính xác khá cao.

Trong bài sau, mình sẽ trình bày một số cái tiến khác, đồng thời thử áp dụng cách thứ 2 xem có hiệu quả hơn không.

Stay tuned!
