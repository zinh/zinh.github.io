---
layout: post
title:  "Kết hợp Ruby và Erlang sử dụng Thrift"
date:   2015-02-01 00:03:04
summary: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
description: Tiếp theo loạt series về các cấu trúc xử lý concurrent, trong bài viết này sẽ giới thiệu pattern Actor cùng việc kết hợp giữa Ruby và Erlang thông qua Thrift.
categories: ruby crawl
---

Trong bài viết trước, ta đã tìm hiểu cách xử lý concurrency đầu tiên thông qua multi-threading. Với một ứng dụng được viết cẩn thận, việc dùng multi-threading sẽ đem lại hiệu quả xử lý rất tốt. Tuy nhiên, không dễ dàng để maintain một ứng dụng concurrency(đặc biệt khi độ phức tạp tăng lên).

Ta lưu ý một đặc điểm của thread: share resource, hậu quả của nó chính là tình trạng nhiều thread cùng truy xuất đồng thời tài nguyên(race condition), dẫn đến những trạng thái không lường trước được của chương trình.

Một cách để giải quyết vấn đề race condition, như đã được đề cập trong bài trước chính là mutex. Tuy nhiên, dùng mutex không hợp lí rất có thể dẫn đến vấn đề tiếp theo(cũng nan giải không kém) chính là deadlock, đây là những sai sót rất dễ xảy ra khi lượng code tăng lên, và việc maintain sẽ rất khó khăn.

Trong bài viết này, ta làm quen với một hô hình xử lý concurrency khác, có tên gọi __Actor Model__.

## What is Actor Model?

Mô hình actor model rất đơn giản, mỗi actor là một process, các actor hoạt động trong address space của riêng mình, không share memory với actor khác. Giữa các actor sẽ communicate với nhau thông qua cơ chế message(hay còn gọi là mailbox).

http://www.scottlogic.com/blog/rdoyle/assets/ActorModel.png

Trong Ruby ta có thể áp dụng Actor model thông qua gem Celluloid. Tuy nhiên, do bị giới hạn bởi GIL nên trên thực tế, các actor không được chạy song song với nhau.

Trong bài viết này, ta sử dụng Erlang để minh họa cho Actor model.

## Why choose Erlang

Erlang là một ngôn ngữ lập trình hàm(có cú pháp hao hao Prolog), được Ericsson thiết kế riêng cho các ứng dụng trong viễn thông(như switch). Một đặc điểm quan trọng của Erlang chính là khả năng xây dựng các ứng dụng fault-tolerant cao, distribute dễ dàng. Erlang được dùng trong các ứng dụng cần tính realtime(như chat, message queue, database). Một số hệ thống được phát triển dựa trên Erlang:

  - Hệ thống chat của Whatsapp
  - RabbitMQ
  - CouchDB, SimpleDB
  - Các server game online như Call of Duty, League of Legends

Tuy nhiên bản thân Erlang cũng có những nhược điểm. Việc có cú pháp dựa trên Prolog làm cho Erlang trở thành một ngôn ngữ không dễ học. Bên cạnh đó, có lẽ do ban đầu được thiết kế dùng trong các ứng dụng viễn thông nên việc xử lý chuỗi trong Erlang khá kém(và chậm). Do đó mặc dù có các web framework trên Erlang(như mochiweb, nitrogen) nhưng Erlang thường không được dùng để xây dựng web application. Erlang thích hợp cho việc xử lý backend, API hơn.

Đây lại là điểm mạnh của Ruby. Do đó trong ứng dụng crawler ta sẽ kết hợp cả hai lại bằng Thrift.

Ứng dụng được chia thành 2 phần: phần HTTP request được implement bằng Erlang, phần parser được implement bằng Ruby. 2 phần này được gắn kết với nhau thông qua Thrift, đọc thêm về bài giới thiệu Thrift tại đây.

Tóm lại mô hình của ứng dụng crawler như sau:

    +---------------+                             +----------------+
    |               |                             |                |
    |               |                             |                |
    |               |                             |                |
    |               |                             |                |
    |               |         +--------+          |                |
    |               |         |        |          |                |
    |   Parser      |  <-->   | Thrift |   <-->   |     Worker     |
    |   (Ruby)      |         |        |          |    (Erlang)    |
    |               |         +--------+          |                |
    |               |                             |                |
    |               |                             |                |
    |               |                             |                |
    |               |                             |                |
    |               |                             |                |
    +---------------+                             +----------------+

Trước tiên ta định nghĩa interface giao tiếp giữa Parser và Worker
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

Trước tiên ta hiện thực class `CrawlerHandler` thực hiện việc parse một trang html(thông qua Nokogiri)

{% highlight ruby %}
# crawler_handler.rb
require 'nokogiri'
require './gen-rb/crawler'
class CrawlerHandler
  def parse(html)
    doc = Nokogiri::HTML(html)
    title_node = doc.at_xpath("//title/text()")
    title = title_node.text if title_node
    links = doc.xpath("//a/@href").map{|link| link.value}
    web_data = WebData.new
    web_data.title = title.strip
    web_data.links = links.map{|link| link.value}

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

## HTTP Worker

Phần HTTP request được hiện thực bằng Erlang. Ta chia thành nhiều worker, mỗi worker sẽ có nhiệm vụ gửi http request đến một url fetch nội dung html của url đó về. Sau đó gửi nội dung html của url đó đến server Parser, lấy danh sách link và title về.
Ta duy trì một danh sách các link cần crawl(có thể hiểu nó như một task queue). Worker sẽ lấy url từ task queue này.

Process worker sẽ lấy link từ Process Link Queue(dùng chung cho tất cả worker). Mỗi khi lấy được link mới, worker sẽ gửi link này đến Task Queue để lên schedule crawl link đó. Để đơn giản, Task Queue thực hiện theo cơ chế FIFO(first in first out). Do đó Task Queue process sẽ nhận các message như sau:

Worker -(push, Link)-> Link Queue

Worker -(pop)-> Link Queue

### Task Queue

Task Queue là một process có behaviour là `gen_server`. Task Queue duy trì 2 danh sách:

  - Queue: các link sẽ được crawl.
  - Crawled: các link đã được crawl(tránh việc crawl lại link đã crawl).

{% highlight erlang %}
-module(task_queue).
-behaviour(gen_server).
-record(state, {queue=[], crawled=[]}).
-define(SERVER, ?MODULE).

%% Public API
start_link() ->
  gen_server:start_link({local, ?SERVER}, ?MODULE, [], []).

pop_link() ->
  gen_server:call(?SERVER, pop).

push_link(Link) ->
  gen_server:cast(?SERVER, {push, Link}).

% Callback function
init(_Args) -> {ok, #state{}}.

%% Lấy 1 link trong Queue và trả về worker. Đẩy link này vào danh sách Crawled
%% Trả về null nếu không còn link trong Queue.
handle_call(pop, _From, State = #state{queue=Queue, crawled=Crawled}) ->
  if Queue == [] ->
       {reply, null, State};
     true ->
       Link = hd(Queue),
       {reply, Link, #state{queue = tl(Queue), crawled = [Link | Crawled]}}
  end.

%% Push link từ worker vào Queue.
%% Trước khi push kiểm tra xem link nãy đã được crawl hay chưa.
handle_cast({push, Link}, State = #state{queue=Queue, crawled=Crawled}) ->
  case (existed(Link, Queue) orelse existed(Link, Crawled)) of
    true ->
      {noreply, State};
    false ->
      {noreply, State#state{queue = [Link | Queue]}}
  end.

%% Private function
%% Kiểm tra xem một phần tử có tồn lại trong list hay không(giống hàm include? trong Ruby)
existed(Item, List) ->
  lists:any(fun(T) -> T == Item end, List).
{% endhighlight %}

### Worker

{% highlight erlang %}
-module(worker).
-include("crawler_thrift.hrl").
-export([start/1]).

start() -> spawn(fun() -> init() end).

init() ->
  inets:start(),
  {ok, RbClient} = thrift_client_util:new("127.0.0.1", 9090, crawler_thrift, []),
  loop(RbClient).

loop(RbClient) ->
  Link = task_queue:pop_link(),
  if Link == null ->
      io:format("No link~n");
    true ->
      {ok, {\{_, 200, _}, _, Body}} = httpc:request(Link),
      {Title, Links, NewRbClient} = parse(Body, RbClient),
      insert_links(Links, ServerPid),
      io:format("[Crawled] ~p~n", [Title]),
      loop(NewRbClient)
  end.

parse(Body, Client) ->
  {NewClient, {ok, Result}} = thrift_client:call(Client, parse, [Body]),
  Title = Result#'WebData'.title,
  Links = Result#'WebData'.links,
  {Title, Links, NewClient}.

insert_links(Links) ->
  [task_queue:push_link(Link) || Link <- Links].
{% endhighlight %}

Với việc dùng Erlang, ứng dụng trên có thể dễ dàng scale các worker sang nhiều máy khác nhau.
Tuy nhiên lúc đó Task Queue trở thành Single Point of Death.
Để hạn chế việc này ta có thể replica Task Queue sang nhiều máy(đơn giản nhất có thể dùng mnesia).

Ngoài ra ta còn có thể áp dụng cơ chế Supervisor của Erlang để quản lý các worker hiệu quả hơn.

Dùng mochi xpath để parse xpath, tránh việc phụ thuộc vào Ruby.
