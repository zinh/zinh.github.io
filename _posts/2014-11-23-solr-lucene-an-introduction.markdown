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

Việc sử dụng LIKE trong SQL rất đơn giản, nhưng lại rất không hiệu quả. Có thể kể đến một số điểm bất lợi sau:

  - Chậm(do không sử dụng được index, đẫn đến phải đọc lên tất cả dữ liệu để so sánh)
  - Không đáp ứng được các yêu cầu tìm kiếm phức tạp
  - ...

Do đó các kỹ thuật full-text search đã ra đời giúp giải quyết bài toán tìm kiếm trên. Nổi tiếng nhất có lẽ là __Inverted Index__ và thuật toán __TF-IDF__

### Interted Index

Inverted index là một cấu trúc dữ liệu thường được sử dụng trong full-text search. Inverted index lưu trữ tần suất xuất hiện của các từ trong các document. Để dễ hình dung ta có ví dụ sau:

Ta cần lập index của 3 đoạn text sau:

```
T[1] = "The quick brown fox"
T[2] = "What does the fox say"
T[3] = "What if"
```

Index sẽ có cấu trúc như sau:

```
the: {1, 2}
quick: {1}
brown: {1}
fox: {1, 2}
what: {2, 3}
does: {2}
say: {2}
if: {3}
```

Nhìn vào inverted index ta thấy từ khóa "the" xuất hiện 2 lần trong T[1] và T[2].

Bằng việc sử dụng inverted index, việc tìm kiếm một từ khóa rất dễ dàng. Ta chỉ cần lấy phép giao giữa các keyword là sẽ được kết quả.

Ví dụ:
Cần tìm kiếm keyword: `what the fox`
Lấy phép giao của keyword `what`, `the` và `fox` ta sẽ được:

{2, 3} {1, 2} {1, 2} = {2}