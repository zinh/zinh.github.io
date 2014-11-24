---
layout: post
title:  "Full-text search: các thuật toán cơ bản"
date:   2014-11-23 00:03:04
summary: Giới thiệu những kiến thức cơ bản về full-text search, inverted index, mô hình vector space và thuật toán scoring.
categories: lucene
---

Trong loạt bài này, mình sẽ lần lượt giới thiệu về full-text search, ứng dụng full-text search dùng thư viện Lucene, Solr cùng với các chủ đề liên quan khác.

### What is full-text search?

Theo [Wikipedia](http://en.wikipedia.org/wiki/Full_text_search) full-text search là kỹ thuật tìm kiếm trên một full-text database. Full-text database là nơi lưu trữ
các dữ liệu dạng text, ví dụ như dữ liệu về nội dung của tất các các trang web(database của Google chẳng hạn), hoặc dữ liệu về các sản phẩm của một trang web e-commerce(database các sản phẩm của Amazon chẳng hạn).

### Tại sao chúng ta lại cần Full-text search?

Rất đơn giản, để có được kết quả search chính xác nhất!

Trước đây khi nghĩ đến tìm kiếm mình thường nghĩ ngay đến LIKE trong SQL. Chẳng hạn muốn tìm kiếm các
sản phẩm trong một table về `products` chẳng hạn mình thường viết một câu query như sau:

{% highlight sql %}
SELECT * FROM products WHERE products.description LIKE "%Adidas%";
{% endhighlight %}

Việc sử dụng LIKE trong SQL rất đơn giản, nhưng lại rất không hiệu quả. Có thể kể đến một số điểm bất lợi sau:

  - Chậm(không sử dụng được index, dẫn đến phải đọc lên tất cả dữ liệu để so sánh)
  - Không đáp ứng được các yêu cầu tìm kiếm phức tạp
  - ...

Do đó các kỹ thuật full-text search đã ra đời giúp giải quyết bài toán tìm kiếm trên.

Thông thường để implement một hệ thống full-text search, ta thường thực hiện qua 2 bước:

Bước 1: index. Đưa các dữ liệu(document) vào index.

Bước 2: tìm kiếm. Query sử dụng index được sinh ra ở bước 1.

Để thực hiện bước index ta cần một cấu trúc dữ liệu đặc biệt giúp cho việc tìm kiếm được dễ dàng hơn. Cấu trúc dữ liệu đó được gọi là __inverted index__

### Interted Index

*Inverted index* là một cấu trúc dữ liệu thường được sử dụng trong full-text search. *Inverted index* lưu trữ tần suất xuất hiện của các từ(term) trong các document.

Để dễ hình dung ta có ví dụ sau:

Ví dụ 1: 

Ta cần lập *inverted index* cho 3 document sau:

    D[1] = "The quick brown fox"
    D[2] = "What does the fox say"
    D[3] = "What if"

*Inverted Index* được tạo thành bằng các term, cùng với id của các document chứa term đó.

    the: {1, 2}
    quick: {1}
    brown: {1}
    fox: {1, 2}
    what: {2, 3}
    does: {2}
    say: {2}
    if: {3}

Bằng việc sử dụng *inverted index* ta có thể implement một thuật toán tìm kiếm đơn giản bằng cách lấy phép giao giữa các term trong từ khóa tìm kiếm.

Ví dụ 2:

Cần tìm kiếm keyword: `what the fox`
Lấy phép giao *inverted index* của các term: `what`, `the` và `fox` ta sẽ được:

{2, 3} \\(\cap\\) {1, 2} \\(\cap\\) {1, 2} = {2}

Như vậy D[2] chính là document cần tìm.

Mô hình tìm kiếm như trên có tên là [Standard Boolean model](http://en.wikipedia.org/wiki/Standard_Boolean_model)

*Tuy nhiên*, với một database có số lượng document lớn, việc matching dùng phép giao như trên sẽ trả về rất nhiều kết quả và người dùng cũng không thể duyệt qua tất cả các kết quả đó để tìm được document mong muốn. Vì thế, ta cần có một thuật toán để ranking các kết quả trả về của *Standard Boolean model*. Document có ranking càng cao chứng đó document đó càng thõa mãn từ khóa tìm kiếm.

Có rất nhiều thuật toán ranking, chẳng hạn như thuật toán [PageRank](http://en.wikipedia.org/wiki/PageRank), Vector Space Model...

### Vector Space Model

Vector space model là mô hình đại số biểu diễn các document và query dưới dạng vector. Ví dụ:

$$
\vec{d_{j}} = (w_{1, j}, w_{2, j}, ..., w_{m, j})\\
\vec{q} = (w_{1, q}, w_{2, q}, w_{3, q}, ..., w_{n, q})
$$

Trong đó \\(w\_{i, j}\\) tỉ lệ với tần số xuất hiện của term i trong document \\(d\_{j}\\), \\(w\_{i, j} = 0\\) nếu document \\(d_{j}\\) không chứa term i.

![Vector space model](http://upload.wikimedia.org/wikipedia/commons/f/ff/Vector_space_model.jpg)

Như vậy mức độ relevance của một document __d__ bất kì với một query __q__ có thể được tính bằng độ lớn của góc \\(\theta\\) giữa vector \\(\vec{d}\\) và \\(\vec{q}\\). Góc càng lớn ranking càng thấp và ngược lại.

$$
cos(\theta) = \frac{\vec{d} \cdot \vec{q}}{\|\vec{d}\| . \|\vec{q}\|}
$$

trong đó

\\(\vec{d} \cdot \vec{q}\\): tích vô hướng giữa \\(\vec{d}\\) và \\(\vec{q}\\)

\\(\\|\vec{d}\\|\\): độ dài của vector \\(\\|\vec{d}\\|\\) 

Có nhiều cách để tính hệ số \\(w\_{i, j}\\) của một document \\(d\_{j}\\). Thông dụng nhất là thuật toán TF-IDF.

### TF-IDF(Term Frequency – Inverse Document Frequency)

Trong tf-idf hệ số `w` được tạo thành bởi 2 thành phần:

TF(term frenquency): tần số xuất hiện của một từ khóa trong một document.

Ví dụ:

Ta có document d = "The quick brown fox jumps over the lazy dog"
tf(t = "the", d) = 2 -> trong document d, từ khóa `the` xuất hiện 2 lần.

Thông thường tần số được đưa vào hàm log
tf(t, d) = 1 + log(f(t, d))

Theo ví dụ trên:

$$
tf("the", d) = 1 + log(2) \approx 0.3
$$

IDF(inverse document frenquency): là hệ số đánh giá mức độ quan trọng của một term. Hệ số càng cao nếu term càng hiếm, và ngược lại. Ví dụ với những term thường xuất hiện như "a", "an", "the" sẽ có chỉ số idf thấp. Cụ thể, idf của 1 term được tính như sau:

$$
idf(t, D) = \log{\frac{N}{|d \in D : t \in d|}}
$$

Cuối cùng hệ số TF-IDF của 1 term là tích của hệ số TF và IDF

$$
tfidf(t, D, d) = tf(t, d) \times idf(t, D)
$$

Trên đây là một số kiến thức cơ bản về full-text search. Trong bài tiếp theo, mình sẽ giới thiệu về Lucene, một thư viện full-text search rất thông dụng hiện nay.
