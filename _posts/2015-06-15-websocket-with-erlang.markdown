---
layout: post
title:  "Websocket với Erlang"
date:   2015-06-15 00:03:04
summary: Trong bài viết này mình tìm hiểu về Websocket thông qua việc viết server Websocket dùng Erlang.
description: Viết thư viện Websocket bằng Erlang
categories: erlang
---

## Giới thiệu về giao thức Websocket
Tuy cũng dùng chung cổng 80 với HTTP nhưng Websocket là một giao thức hoàn toàn khác được mô tả chi tiết trong tài liệu RFC 6455.

WebSocket cho phép tạo kênh giao tiếp 2 chiều giữa client và server. Do đó WebSocket thường được dùng trong các ứng dụng cần tính realtime cao như chat, streaming...

Hiện websocket được hỗ trợ trong hầu hết các trình duyệt thông dụng(Firefox, Chrome, Safari, IE).

Thông thường giao thức websocket được thực hiện thông qua 2 bước:

### 1. Handshake

Khi một client muốn tạo kết nối WebSocket đến server, trước tiên client này phải gửi một package handshake thông báo muốn tạo kết nối. 
Packet này có các header tương tự như HTTP(nhưng có thêm một số header dùng riêng cho WebSocket). Ví dụ một package handshake thông thường sẽ có format như sau:

    GET / HTTP/1.1
    Host: localhost:8080
    Sec-WebSocket-Version: 13
    Sec-WebSocket-Extensions: permessage-deflate
    Sec-WebSocket-Key: c2lSCdOdenbPOyfPhCbRpg==
    Connection: keep-alive, Upgrade
    Upgrade: websocket

Đặc điểm nhận biết của packet này chính là các header: Upgrade, Sec-WebSocket-Version, Sec-WebSocket-Extensions, Sec-WebSocket-Key. Trong đó ta chú ý đến header `Sec-WebSocket-Key` vì sẽ phải sử dụng key này để reply lại cho client.

Khi server nhận được packet handshake, sẽ tạo một packet để reply, thông báo đồng ý tạo kết nối. Packet này có các header sau:

    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: [accept key]
	
Ta chú ý header Sec-WebSocket-Accept chứa accept key được tạo thành dựa trên `Sec-WebSocket-Key` ở trên.

### 2. Send/receive

Sau khi handshake thành công, data trao đổi qua lại giữa client và server sẽ thông qua các frame. Format các frame này sẽ được mô tả kỹ hơn trong phần hiện thực.

## Hiện thực quá trình handshake

#### Khởi tạo TCP Socket trong Erlang

Để start một tcp socket trong Erlang, ta dùng thư viện `gen_tcp`:

{% highlight erlang %}
{ok, LSocket} = gen_tcp:listen(8080, [{active, true}])
{% endhighlight %}

Sau khi có Listen Socket, ta accept connection từ client bằng hàm `accept` như sau:

{% highlight erlang %}
{ok, Socket} = gen_tcp:accept(LSocket)
{% endhighlight %}

Các request và response đều sẽ được thực hiện thông qua object `Socket` ở trên. Kết hợp 2 hàm trên lại ta có một chương trình đơn giản như sau:

{% highlight erlang %}
start_server(Port) ->
  {ok, LSocket} = gen_tcp:listen(8080, [{active, true}])
  acceptor(LSocket).

acceptor(LSocket) ->
  {ok, Socket} = gen_tcp:accept(LSocket),
  spawn(fun() -> acceptor(LSocket) end),
  handle(Socket).
{% endhighlight %}

Mỗi khi có connection đến, server sẽ tạo một process mới để handle connection này(thông qua hàm `spawn`). Bằng cách này, server có thể handle được nhiều connection cùng lúc.

Hàm `handle` ở trên sẽ là hàm đảm nhiệm gửi nhận message với từng client. Đầu tiên ta xử lý bước handshake.

#### Function handshake

{% highlight erlang %}
handle(Socket) ->
  handshake(Socket).

handshake(Socket) ->
  receive
    {tcp, Socket, Packet} ->
      {Path, Headers} = parse_packet(Packet)
  end.
{% endhighlight %}

Ta viết một helper đơn giản để parse http headers.

{% highlight erlang %}
parse_packet(Packet) ->
  {ok, {http_request, _, {abs_path, Path}, _}, Rest} = erlang:decode_packet(http, Packet, []),
  Headers = parse_header(Rest),
  {Path, Headers}.

parse_header(Headers)
  parse_header(Headers, []).

parse_header(Packet, Headers) ->
  case erlang:decode_packet(httph, Packet, []) of 
    {ok, {http_header, _, Key, _, Value}, Rest} ->
      parse_header(Rest, [{Key, Value} | Headers]);
    {ok, http_eoh, _} ->
      Headers;
    {error, _Reason} ->
      Headers
  end.
{% endhighlight %}

Hàm tạo Key

{% highlight erlang %}
-define(MAGIC_STRING, "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").
websocket_key(Key) ->
  HashKey = crypto:hash(sha, Key ++ ?MAGIC_STRING),
  base64:encode(HashKey).
{% endhighlight %}

Hàm reply handshake

{% highlight erlang %}
reply_handshake(Socket, Headers)
  Key = proplists:get_value("Sec-Websocket-Key", Headers),
  AcceptKey = websocket_key(Key),
  Data = [<<"HTTP/1.1 101 Switching Protocols\r\n",
    "Upgrade: websocket\r\n",
    "Connection: Upgrade\r\n",
    "Sec-WebSocket-Accept: ">>,
    AcceptKey,
    <<"\r\n\r\n">>],
  gen_tcp:send(Socket, Data).
{% endhighlight %}

Để kiểm tra bước handshake, ta kiểm tra ở console của trình duyệt như sau:

{% highlight javascript %}
var socket = new WebSocket("ws://localhost:8080");
{% endhighlight %}

## Nhận message từ client

Data frame gửi từ client sẽ có format như sau:

     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    +-+-+-+-+-------+-+-------------+-------------------------------+
    |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
    |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
    |N|V|V|V|       |S|             |   (if payload len==126/127)   |
    | |1|2|3|       |K|             |                               |
    +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
    |     Extended payload length continued, if payload len == 127  |
    + - - - - - - - - - - - - - - - +-------------------------------+
    |                               |Masking-key, if MASK set to 1  |
    +-------------------------------+-------------------------------+
    | Masking-key (continued)       |          Payload Data         |
    +-------------------------------- - - - - - - - - - - - - - - - +
    :                     Payload Data continued ...                :
    + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
    |                     Payload Data continued ...                |
    +---------------------------------------------------------------+

__FIN bit__: bằng 1 nếu đây là frame cuối cùng(hoặc frame này không được cắt ra thành nhiều frame nhỏ).

3 bit tiếp theo được dùng cho các extension version. Mặc định sẽ bằng 0.

__Opcode(4 bits)__: format của payload. Bằng 1 nếu payload có định dạng text.

__Mask(1 bit)__: bằng 1 nếu payload được mask, bằng 0 trong trường hợp ngược lại. Chú ý message gửi từ client lúc nào cũng sẽ được mask. Còn message gửi từ server có thể mask hoặc không mask tùy ý.

__Payload len(7 bit)__: chiều dài của payload. Ta chú ý field Payload len có 7 bit, ứng với các giá trị từ 0 đến 127.

  - Trong trường hợp giá trị payload len nhỏ hơn 126, giá trị này chính là chiều dài của payload.
  - Nếu Payload len = 126, chiều dài của payload sẽ là giá trị integer của 32 bit(4 bytes) tiếp theo.
  - Nếu Payload len = 127, chiều dài của payload sẽ là giá trị integer của 64 bit(8 bytes) tiếp theo.

__Masking-key(32 bit, 4 bytes)__: Key dùng để decode Payload. Field này chỉ xuất hiện nếu Mask bit = 1.

Sau cùng là phần __Payload__, chính là nội dung message gửi từ Client.

Nhờ khả năng *matching* của Erlang, việc parse packet khá dễ dàng:

{% highlight erlang %}
parse_frame(Frame) ->
  case Frame of
    <<_Fin:1, _:3, _Opcode:4, _Mask:1, PayloadLen:7, Key:4/binary, Payload/binary>> when PayloadLen < 126 ->
      decode(Key, Payload);
    <<_Fin:1, _:3, _Opcode:4, _Mask:1, PayloadLen:7, _Len:32/integer, Key:4/binary, Payload/binary>> when PayloadLen =:= 126 ->
      decode(Key, Payload);
    <<_Fin:1, _:3, _Opcode:4, _Mask:1, PayloadLen:7, _Len:64/integer, Key:4/binary, Payload/binary>> when PayloadLen =:= 127 ->
      decode(Key, Payload);
    _ ->
      {error, bad_format}
  end.
{% endhighlight %}

## Gửi message đến client

## Tham khảo

https://tools.ietf.org/html/rfc6455
