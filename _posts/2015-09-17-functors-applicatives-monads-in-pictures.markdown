---
layout: post
title:  "Functor, Applicative, Monad"
date:   2015-09-16 00:03:04
summary: Bài viết giải thích về các khái niệm trong lập trình hàm như functor, applicative, monad
description: Bài viết giải thích về các khái niệm trong lập trình hàm như functor, applicative, monad
categories: haskell
---

### Value and Context

Trước hết, ta có một giá trị kiểu số như sau:

![a value of 2](http://adit.io/imgs/functors/value.png)

Khi áp dụng một hàm số, chẳng hạn hàm cộng vào số trên ta được kết quả là một giá trị số khác. Chẳng hạn:

![(+3) 2](http://adit.io/imgs/functors/value_apply.png)

> Kí hiệu `(+3)` là kí hiệu cho hàm `f(x) = x + 3`
>
> Do đó `(+3) 2` tương đương với `f(2) = 2 + 3 = 5`

Ta mở rộng khái niệm giá trị trên, cho nó vào một ngữ cảnh(context), có thể hình dung như lấy giá trị đó bỏ vào một cái hộp

![value and context](http://adit.io/imgs/functors/value_and_context.png)

Khi áp dụng một hàm số vào trong chiếc hộp này, ta nhận được kết quả khác nhau, tùy theo chiếc hộp và giá trị chứa bên trong nó.

Trước khi tiếp tục, ta làm quen với kiểu dữ liệu `Maybe`. Signature của `Maybe` trong Haskell như sau:

{% highlight haskell %}
data Maybe a = Nothing | Just a
{% endhighlight %}

`a` ở đây là một kiểu dữ liệu bất kì. Chẳng hạn:

`Maybe Int`, `Maybe Float`, `Maybe String`

`Maybe Int` sẽ có các giá trị: `Nothing`, `Just -1`, `Just 0`,`Just 1`, `Just 100`...

![Maybe](http://adit.io/imgs/functors/context.png)

Sau đây ta sẽ làm quen với khái nhiệm Functor

### Functor

Khi một giá trị được đặt trong một context(chẳng hạng `Just 2`), ta không thể áp dụng hàm `(+3)` như trên được.

![(+3) Just 2](http://adit.io/imgs/functors/no_fmap_ouch.png)

Vì thế, xuất hiện hàm `fmap` giúp ta làm được việc không thể trên. `fmap` sẽ lấy giá trị trong chiếc hộp đó ra và áp dụng hàm số (+3) vào, lấy kết quả bỏ vào hộp trở lại.

![fmap (+3) (Just 2)](http://adit.io/imgs/functors/fmap_apply.png)

Thế nhưng, làm cách nào `fmap` biết cách áp hàm (+3) vào giá trị `Just 2`?

Functor là một *typeclass*. Đây là định nghĩa của __Functor__

> 1. Để implement một kiểu dữ liệu f có typeclass là __Functor__
>
> 2. Ta định nghĩa một hàm `fmap` trên kiểu dữ liệu đó, thõa mãn:
>
> `fmap :: (a -> b) -> f a -> f b`
>
> Có thể hiểu khái niệm typeclass giống như khái niệm abstract class/interface trong Java

Vì thế, một kiểu dữ liệu được gọi là Functor nếu kiểu dữ liệu đó định nghĩa một hàm `fmap`

![fmap explanation](http://adit.io/imgs/functors/fmap_def.png)

`Maybe` là một functor, do đó ta có thể gọi `fmap` cho `Maybe` như sau:

{% highlight haskell %}
> fmap (+3) (Just 2)
Just 5
{% endhighlight %}

Ở bên dưới, `fmap` hoạt động như sau:

![fmap Maybe](http://adit.io/imgs/functors/fmap_just.png)

Trước khi tiếp tục, thử trả lời câu hỏi sau:

{% highlight haskell %}
> fmap (+3) Nothing
???
{% endhighlight %}

![fmap Nothing](http://adit.io/imgs/functors/fmap_nothing.png)

{% highlight haskell %}
> fmap (+3) Nothing
Nothing
{% endhighlight %}

Áp một hàm vào `Nothing` sẽ nhận được `Nothing`, không còn gì hợp lí hơn!

Việc này giúp ta đỡ phải xét giá trị `nil`, như vòng `if` sau:

{% highlight ruby %}
post = Post.find_by(id: 1)
if post
  return post.title
else
  return nil
end
{% endhighlight %}

chỉ cần 1 dòng trong Haskell:

{% highlight haskell %}
fmap getPostTitle (findPost 1)
{% endhighlight %}

`<$>` là phiên bản toán tử trung tố của `fmap`, ta có thể viết lại ví dụ trên như sau:

{% highlight haskell %}
getPostTitle <$> (findPost 1)
{% endhighlight %}

Hỏi thêm 1 câu hỏi nhỏ trước khi tiếp tục: khi áp dụng một hàm số vào trong một __List__ thông qua `fmap`, ta sẽ được gì?

{% highlight haskell %}
> fmap (+3) [1,2,3,4]
???
{% endhighlight %}

![fmap over a list](http://adit.io/imgs/functors/fmap_list.png)

List cũng là một datatype thuộc Functor.

{% highlight haskell %}
instance Functor [] where
  fmap = map
{% endhighlight %}

Ví dụ cuối cùng: kết quả của `fmap` trên một function là gì?

{% highlight haskell %}
> fmap (+3) (+2)
???
{% endhighlight %}

Trả lời: kết quả là một hàm khác.

{% highlight haskell %}
> let f = fmap (+3) (+2)
> f 10
15
{% endhighlight %}

Đây là định nghĩa `fmap` trên một hàm số:


{% highlight haskell %}
instance Functor ((->) r) where
  fmap f g = f . g
{% endhighlight %}

Như vậy, fmap của 2 hàm số chẳng qua là hàm hợp của 2 hàm số đó thôi