---
layout: post
title:  "Thu thập dữ liệu từ website cùng với Ruby"
date:   2015-01-06 00:03:04
summary: Trong bài này, ta tìm hiểu cấu trúc của một chương trình crawler đơn giản đồng thời áp dụng multi-threading để cải thiện tốc độ thực thi.
description: Trong bài này, ta tìm hiểu cấu trúc của một chương trình crawler đơn giản đồng thời áp dụng multi-threading để cải thiện tốc độ thực thi.
categories: ruby crawl
---

Với cú pháp sử dụng đơn giản, cùng với các hàm xử lý chuỗi, parsing HTML linh hoạt, công việc thu thập dữ liệu(crawler) rất thích hợp khi viết bằng ngôn ngữ Ruby.

Trong series về crawler này, thông qua việc phát triển ứng dụng crawler, ta sẽ làm quen với các pattern thường được sử dụng trong xử lý concurrency(như multi-threading, actor model, reactor pattern).

Trước tiên là một chương trình crawler đơn giản, sử dụng cấu trúc tuần tự.

{% highlight ruby %}
class Crawler
  def initialize
    # link queue(to be crawled)
    @queue = ["http://tuoitre.vn"]
    # crawled links
    @crawled = []
  end

  def run
    # while there still have link in queue
    while link = next_link
      # get HTML and parse using the usual Nokogiri gem
      page = Nokogiri::HTML(open(link))
      # analyze page content
      page_analyze(page, link)
      # push new link to queue
      push_link(doc)
    end
  end
end
{% endhighlight %}

Ở chương trình trên, ngoài danh sách các link cần crawl(biến `@queue` ở class `Crawler`), để tránh việc crawl trùng các link, ta duy trì thêm một danh sách các link đã crawl(biến `@crawled`).

Hàm `run` sẽ chạy một vòng lặp để lấy lần lượt các link trong queue ra(hàm `next_link`), request HTML và dùng Nokogiri để parse nội dụng file HTML đó nhằm lấy ra các thông tin cần thiết(hàm `page_analyze`).

Chẳng hạn, đoạn code sau lấy nội dung thẻ title của một trang web và output ra terminal:

{% highlight ruby %}
def page_analyze(doc, link)
  puts doc.at_xpath("//title/text()").text if doc.at_xpath("//title/text()")
end
{% endhighlight %}

Ngoài ra, nhằm đẩy các link vào trong queue, ta implement thêm hàm `push_link`. Hàm này có nhiệm vụ lấy tất cả internal link chưa crawl(nhờ vào biến `@crawled`) và đẩy vào queue.

{% highlight ruby %}
def push_link(doc)
  doc.xpath("//a/@href").each do |url|
    current_url = url.value
    @links.push(current_url) if insertable?(current_url)
  end
end
{% endhighlight %}

Đoạn script trên rất đơn giản và dễ dùng. Tuy nhiên lại chạy rất chậm. Nguyên nhân nằm ở vòng lặp while của hàm run. Ở mỗi lần lặp, sau khi request url chương trình phải dừng luồn thi hành để đợi response trả về. Để tránh lãng phí thời gian chờ đợi này, cần áp dụng các kỹ thuật xử lý concurrency để tăng tốc độ xử lý.

Trước tiên trong bài viết này, ta tìm đến giải pháp kinh điển nhất: __multi-threading__

Do Ruby(MRI) áp dụng [GIL\(Global Intepreter Lock\)](http://en.wikipedia.org/wiki/Global_Interpreter_Lock){:target="_blank"}{:rel="nofollow"}, nên dù có sinh ra nhiều thread nhưng trong cùng một thời điểm chỉ có một thread duy nhất được thi hành.

Tuy nhiên, khi một thread ở trạng thái IO blocking, các thread khác sẽ được Ruby đưa lên xử lý. Do đó ứng dụng multi-threading vào ứng dụng crawler(IO bound) là hoàn toàn hợp lí.

Ta thay đổi cấu trúc của class `Crawler` như sau:

{% highlight ruby %}
class Crawler
  def run
    # let run with 4 threads
    workers = (0...4).map do
      Thread.new do
        # these code will execute by each thread
        while link = next_link
          doc = Nokogiri::HTML(open(link))
          page_analyze(doc, link)
          push_link(doc)
        end
      end
    end
  
    workers.map(&:join)
  end
end
{% endhighlight %}

Trong đoạn code trên, ta dùng [Thread Pool](http://en.wikipedia.org/wiki/Thread_pool_pattern){:target="_blank"}{:rel="nofollow"} để tạo ra 4 thread cùng lúc. Các thread này sẽ truy cập vào mảng `@queue` để lấy link cần crawl, request và xử lý response. Do đó cấu trúc của hàm `page_analyze` không thay đổi.

Tuy nhiên, do chạy muli-threading nên đã phát sinh vấn đề về truy xuất tài nguyên dùng chung(ở đây là biến `@queue` và biến `@crawled`). Để giải quyết vấn đề này, ta có thể dùng [mutex](http://en.wikipedia.org/wiki/Mutual_exclusion){:target="_blank"}{:rel="nofollow"} để lock lại việc access các biến dùng chung này, cụ thể như sau:

{% highlight ruby %}
class Crawler
  def initialize
    ...
    @mutex = Mutex.new
  end
end
{% endhighlight %}

Khi đó mỗi khi cần truy xuất vào các biến dùng chung ta dùng hàm `synchronize` của mutex để lock biến đó lại, chẳng hạn hàm `next_link` có thể được implement như sau:

{% highlight ruby %}
def next_link
  link = nil
  @mutex.synchronize do
    link = @links.shift
    @crawled.push(link) if link
  end

  link
end
{% endhighlight %}

Với việc áp dụng multi-threading, chương trình crawler đã tăng tốc độ crawl lên đáng kể.

Trong bài viết sau, ta sẽ áp dụng một kỹ thuật khác cũng rất hay được sử dụng trong xử lý concurrency đó là mô hình actor(actor model).

Một số link tham khảo về threading và mutex:

[http://www.ruby-doc.org/core/Thread.html](http://www.ruby-doc.org/core/Thread.html){:target="_blank"}{:rel="nofollow"}

[http://ruby-doc.org/core/Mutex.html](http://ruby-doc.org/core/Mutex.html){:target="_blank"}{:rel="nofollow"}
