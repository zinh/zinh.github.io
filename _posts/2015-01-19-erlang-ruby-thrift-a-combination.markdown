---
layout: post
title:  "Kết hợp Ruby và Erlang sử dụng Thrift"
date:   2015-02-01 00:03:04
summary: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
description: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
categories: ruby crawl
---

Trong bài viết trước, ta đã tìm hiểu cách xử lý concurrency đầu tiên thông qua multi-threading. Với một ứng dụng được viết cẩn thận, việc dùng multi-threading sẽ đem lại hiệu quả xử lý rất tốt. Tuy nhiên, đời ko như là mơ, code viết ra lúc nào cũng có lỗi.

Ta lưu ý một đặc điểm của thread: share resource, hậu quả của nó chính là tình trạng nhiều thread cùng truy xuất đồng thời tài nguyên(hay còn gọi là race condition), dẫn đến những trạng thái không lường trước được của chương trình.

Một cách để giải quyết vấn đề race condition, như đã được đề cập trong bài trước chính là mutex. Tuy nhiên, dùng mutex không hợp lí rất có thể dẫn đến vấn đề tiếp theo(cũng nan giải không kém) chính là deadlock, đây là những sai sót rất dễ xảy ra khi lượng code tăng lên, và việc maintain rất khó khăn.

Trong bài viết này, ta làm quen với một hô hình xử lý concurrency khác, có tên gọi __Actor Model__.

## What is Actor Model?

Actor model rất đơn giản, mỗi actor là một process, các actor hoạt động trong address space của riêng mình, không share resource với actor khác. Giữa các actor sẽ communicate với nhau thông qua cơ chế message(hay còn gọi là mailbox).

http://www.scottlogic.com/blog/rdoyle/assets/ActorModel.png

Trong Ruby ta có thể áp dụng Actor model thông qua gem Celluloid. Tuy nhiên, do bị giới hạn bởi GIL nên trên thực tế, các actor không được chạy song song với nhau.

Trong bài viết này, ta sử dụng Erlang để minh họa cho Actor model.

Nhằm làm cho chương trình thêm phức tạp, mình chia ứng dụng thành 2 phần: phần HTTP request được implement bằng Erlang, phần parsing được implement bằng Ruby. 2 phần này được gắn kết với nhau thông qua Thrift, đọc thêm về bài giới thiệu Thrift tại đây.

Tóm lại mô hình của ứng dụng crawler như sau:

[Ruby parser] <==Thrift==> [Erlang http process]

Trước tiên ta định nghĩa interface giao tiếp giữa parser và http request

## Thrift interface

    struct WebData {
      1: string title,
      2: list<string> links
    }
    
    service Crawler {
      WebData parse(1: string html)  
    }

File trên định nghĩa structure `WebData` và hàm `parse`.

Structure `WebData` dùng để lưu dữ liệu sau khi được parse của một trang html. Bao gồm title và các internal link của trang html đó.

Hàm `parse` nhận vào tham số là chuỗi html, thực hiện việc parse data và trả về WebData cho client.

Để sinh ra file thư viện tương ứng với Erlang và Ruby ta thực hiện lệnh

    thrift --gen rb crawler.thrift
    thrift --gen erl crawler.thrift

Kết quả của lệnh trên là 2 thư mục `gen-rb` và `gen-erl`

## Ruby parser

Trước tiên ta hiện thực class CrawlerHandler thực hiện việc parse một trang html(thông qua gem Nokogiri)

{% highlight ruby %}
# crawler_handler.rb
require 'nokogiri'
require './gen-rb/crawler'
class CrawlerHandler
  def handler(html)
    doc = Nokogiri::HTML(html)
    title = title_node.text if title_node
    links_node = doc.xpath("//a/@href")
    web_data = WebData.new
    web_data.title = title.strip
    web_data.links = links.uniq

    web_data
  end
end
{% endhighlight %}

Parser sẽ lắng nghe ở cổng 9090 để nhận các request đến hàm parse.

{% highlight ruby %}
require 'thrift'
require './gen-rb/crawler'
require './crawler_handler'

handler = CrawlerHandler.new
processor = Crawler::Processor.new(handler)
transport = Thrift::ServerSocket.new(9090)
transportFactory = Thrift::BufferedTransportFactory.new()
server = Thrift::SimpleServer.new(processor, transport, transportFactory)

puts "Starting server..."
server.serve
puts "Stopping server..."
{% endhighlight %}

## HTTP Request

Phần HTTP request được hiện thực bằng Erlang. Ta chia thành nhiều worker, mỗi worker sẽ có nhiệm vụ gửi http request đến một url fetch nội dung html của url đó về. Sau đó gửi html đó đến server Parser, lấy danh sách link và title về.

Ta duy trì một danh sách các link cần crawler(có thể hiểu nó như một task list). Worker sẽ lấy url từ task list này.

Process worker sẽ lấy link từ Process Link Queue(dùng chung cho tất cả worker). Mỗi khi lấy được link mới, worker sẽ gửi link này đến Link Queue để lên schedule crawl link đó. Để đơn giản, link queue thực hiện theo cơ chế FIFO(first in first out). Do đó Link Queue process sẽ nhận các message như sau:


Worker -(push, Link)-> Link Queue

Worker -(pop)-> Link Queue

[TODO] Paste code here(handle call, handle cast only)

### Worker

{% highlight erlang %}
-module(client).
-include("crawler_thrift.hrl").
-export([start/1]).

start(ServerPid) -> spawn(fun() -> init(ServerPid) end).

init(ServerPid) ->
  inets:start(),
  {ok, RbClient} = thrift_client_util:new("127.0.0.1", 9090, crawler_thrift, []),
  loop(ServerPid, RbClient).

parse(Body, Client) ->
  {NewClient, {ok, Result}} = thrift_client:call(Client, parse, [Body]),
  Title = Result#'WebData'.title,
  Links = Result#'WebData'.links,
  {Title, Links, NewClient}.

insert_links(Links, ServerPid) ->
  [server:push_link(ServerPid, Link) || Link <- Links].
{% endhighlight %}

### Link queue

{% highlight erlang %}
handle_call(pop, _From, Links = #links{queue=Queue, crawled=Crawled}) ->
  if Queue == [] ->
       {reply, null, Links};
     true ->
       Link = hd(Queue),
       {reply, Link, #links{queue = tl(Queue), crawled = [Link | Crawled]}}
  end;

handle_cast({push, Link}, Links = #links{queue=Queue, crawled=Crawled}) ->
  % io:format("[INFO] Server received ~p~n", [Link]),
  if is_bitstring(Link) ->
      NewLink = erlang:bitstring_to_list(Link);
    true ->
      NewLink = Link
  end,
  case (lists:any(fun(T) -> T == NewLink end, Queue) or lists:any(fun(T) -> T == NewLink end, Crawled)) of
    true ->
      {noreply, Links};
    false ->
  %    io:format("[INFO] Server inserted ~p~n", [NewLink]),
      {noreply, Links#links{queue = [NewLink | Queue]}}
  end;
{% endhighlight %}
