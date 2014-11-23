---
layout: post
title:  "Fulltext search voi Lucene va Solr"
date:   2014-11-23 00:03:04
summary: 
categories: solr
---

Trong loạt bài này, mình sẽ lần lượt giới thiệu về Full-text search cùng với các thư viện hỗ trợ Full-text search
tiêu biểu và được sử dụng nhiều nhất là Solr/Lucene.

### What is full-text search?

Theo wikipedia full-text search là kỹ thuật tìm kiếm trên một full-text database. Full-text database là nơi lưu trữ
các dữ liệu dạng text, ví dụ như dữ liệu về nội dung của tất các các trang web(database của Google chẳng hạng), hoặc dữ liệu về các sản phẩm của một trang web e-commerce(database các sản phẩm của Amazon chẳng hạn).

### Tại sao chúng ta lại cần Full-text search?

Rất đơn giản, để có được kết quả search chính xác nhất!

Trước đây(từ hồi xa xưa) khi nghĩ đến tìm kiếm mình thường nghĩ ngay đến LIKE trong SQL. Chẳng hạn muốn tìm kiếm một
sản phẩm trong một table về `products` chẳng hạn mình thường viết một câu query tựa tựa như sau:

```sql
SELECT * FROM products WHERE products.description LIKE "%Adidas%";
```
