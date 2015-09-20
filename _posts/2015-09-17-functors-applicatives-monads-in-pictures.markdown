---
layout: post
title:  "Functor, Applicative, Monad"
date:   2015-09-16 00:03:04
summary: Bài viết giải thích một cách đơn giản về các khái niệm trong lập trình hàm như functor, applicative, monad
description: Bài viết giải thích một cách đơn giản về các khái niệm trong lập trình hàm như functor, applicative, monad
categories: haskell
---

Bài viết này được lược dịch lại từ bản tiếng Anh: [Functors, Applicatives, And Monads In Pictures](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html){:target="_blank"}{:rel="nofollow"}, giải thích khá dễ hiểu các khái niệm căn bản trong lập trình hàm(với ví dụ minh hoạ của ngôn ngữ Haskell)

Trước tiên ta làm quen với khái niệm value và context

## Value and Context

Trước hết, ta có một giá trị kiểu số, chẳng hạn như:

![a value of 2](http://adit.io/imgs/functors/value.png)

Khi áp dụng một function, chẳng hạn function cộng vào số trên ta được kết quả là một giá trị số khác.

![(+3) 2](http://adit.io/imgs/functors/value_apply.png)

> Kí hiệu `(+3)` là kí hiệu cho hàm `f(x) = x + 3`.
>
> Do đó `(+3) 2` tương đương với `f(2) = 2 + 3 = 5`

Ta mở rộng khái niệm giá trị trên, cho nó vào một ngữ cảnh(context), có thể tưởng tượng như lấy giá trị đó bỏ vào một cái hộp

![value and context](http://adit.io/imgs/functors/value_and_context.png)

Khi áp dụng một function vào trong chiếc hộp này, ta nhận được kết quả khác nhau, tùy theo chiếc hộp và giá trị chứa bên trong nó.

Trước khi tiếp tục, ta làm quen với kiểu dữ liệu `Maybe`. Định nghĩa của `Maybe` trong Haskell như sau:

{% highlight haskell %}
data Maybe a = Nothing | Just a
{% endhighlight %}

`a` ở đây là một kiểu dữ liệu bất kì(Int, Float, Function,...). Chẳng hạn:

`Maybe Int`, `Maybe Float`, `Maybe String`

`Maybe Int` sẽ có các giá trị: `Nothing`, `Just -1`, `Just 0`,`Just 1`, `Just 100`...

![Maybe](http://adit.io/imgs/functors/context.png)

`Nothing` gần giống như khái niệm `null` trong các ngôn ngữ lập trình khác.

Sau đây ta sẽ làm quen với khái nhiệm __Functor__

## Functor

Khi một giá trị được đặt trong một context(chẳng hạng `Just 2`), ta không thể áp dụng hàm `(+3)` như trên được.

{% highlight haskell %}
> (Just 2) + 3
ERROR!!!
{% endhighlight %}

![(+3) Just 2](http://adit.io/imgs/functors/no_fmap_ouch.png)

Vì thế, xuất hiện hàm `fmap` giúp ta làm được việc không thể trên.
`fmap` sẽ lấy giá trị trong chiếc hộp đó ra và áp dụng function `(+3)`, lấy kết quả bỏ vào hộp trở lại.

![fmap (+3) (Just 2)](http://adit.io/imgs/functors/fmap_apply.png)

Thế nhưng, làm cách nào `fmap` biết cách áp hàm `(+3)` vào giá trị `Just 2`?

__Functor__ là một *typeclass*. Đây là định nghĩa của __Functor__

> Để implement một kiểu dữ liệu f có typeclass là __Functor__
> ta định nghĩa một hàm `fmap` trên kiểu dữ liệu đó, thõa mãn:
>
>     fmap :: (a -> b) -> f a -> f b
> Có thể hiểu khái niệm typeclass giống như khái niệm abstract class/interface trong Java.
> Một kiểu dữ liệu có thể implement nhiều typeclass khác nhau.

Vì thế, một kiểu dữ liệu được gọi là __Functor__ nếu kiểu dữ liệu đó định nghĩa một hàm `fmap`

![fmap explanation](http://adit.io/imgs/functors/fmap_def.png)

`Maybe` là một functor, do đó ta có thể gọi `fmap` cho `Maybe` như sau:

{% highlight haskell %}
> fmap (+3) (Just 2)
Just 5
{% endhighlight %}

`Maybe` định nghĩa `fmap` như sau:

{% highlight haskell %}
instance Functor Maybe where
  fmap f Nothing = Nothing
  fmap f (Just value) = Just (f value)
{% endhighlight %}

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

![Nothing goes in, nothing goes out](http://adit.io/imgs/functors/bill.png)

Việc này giúp ta đỡ phải xét giá trị `null`, chẳng hạn như câu `if` sau trong Ruby:

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

`<$>` là phiên bản trung tố của `fmap`, ta có thể viết lại ví dụ trên như sau:

{% highlight haskell %}
getPostTitle <$> (findPost 1)
{% endhighlight %}

Hỏi thêm 1 câu hỏi nhỏ trước khi tiếp tục: khi áp dụng một function vào trong một __List__ thông qua `fmap`, ta sẽ được gì?

{% highlight haskell %}
> fmap (+3) [1,2,3,4]
???
{% endhighlight %}

![fmap over a list](http://adit.io/imgs/functors/fmap_list.png)

List cũng là một Functor:

{% highlight haskell %}
instance Functor [] where
  fmap = map
{% endhighlight %}

Như vậy kết quả `fmap` của một function và một List chính là hàm map của function trên List đó.

{% highlight haskell %}
> fmap (+3) [1,2,3,4]
[4, 5, 6, 7]
{% endhighlight %}

Ví dụ cuối cùng: kết quả của `fmap` trên một function là gì?

{% highlight haskell %}
> fmap (+3) (+2)
???
{% endhighlight %}

Trả lời: kết quả là một function khác.

{% highlight haskell %}
> let f = fmap (+3) (+2)
> f 10
15
{% endhighlight %}

![fmap over two functions](http://adit.io/imgs/functors/fmap_function.png)

Đây là định nghĩa `fmap` trên một function:

{% highlight haskell %}
instance Functor ((->) r) where
  fmap f g = f . g
{% endhighlight %}

> Trong Haskell, kí hiệu `.` có nghĩa là hàm hợp của hai function(lấy output của function này làm input của function kia)

Như vậy, `fmap` của 2 function chẳng qua là phép hợp của 2 function đó.

## Applicative

Trở lại với value và context:

![value and context](http://adit.io/imgs/functors/value_and_context.png)

Function của ta cũng được wrap trong một context:

![function in context](http://adit.io/imgs/functors/function_and_context.png)

Như thế làm sao có thể áp dụng function vào value?(rõ ràng `fmap` không phát huy được tác dụng trong trường hợp này).

Tương tự như __Functor__, ta có typeclass __Applicative__ để giải quyết vấn đề trên. __Applicative__ định nghĩa hàm `<*>` nhận vào tham số là một context function và một context value.

Ví dụ cho `Just 2` và `Just (+3)`:

![applicative maybe](http://adit.io/imgs/functors/applicative_just.png)

Hay:

{% highlight haskell %}
> Just (+3) <*> (Just 2)
Just 5
{% endhighlight %}

Câu hỏi: kết quả của biểu thức sau là gì?

{% highlight haskell %}
> [(*2) (*3)] <*> [1, 2, 3]
???
{% endhighlight %}

![Applicative and list](http://adit.io/imgs/functors/applicative_list.png)

Do đó:
{% highlight haskell %}
> [(*2) (*3)] <*> [1, 2, 3]
[2, 4, 6, 4, 5, 6]
{% endhighlight %}

Với việc kết hợp giữa Functor và Applicative, ta có thể áp dụng một function có 2 tham số vào 2 giá trị, chẳng hạn như ta có `(+)`, `Just 3`, `Just 5`, làm sao để được `Just 8`?

> Chú ý trong Haskell, 2 cách viết sau là tương đương:
>
>     2 + 3
>     (+) 2 3

{% highlight haskell %}
> (+) <$> (Just 5)
Just (+5)
> Just (+5) <*> (Just 3)
Just 8
{% endhighlight %}

Haskell cung cấp hàm `liftA2` để thực hiện công việc trên:

{% highlight haskell %}
> liftA2 (+) (Just 3) (Just 5)
Just 8
{% endhighlight %}

## Monad

Hiện giờ, ta có 2 typeclass:

__Functor__: áp dụng cho function và context value

![](http://adit.io/imgs/functors/fmap.png)

__Applicative__: áp dụng cho context function và context value

![](http://adit.io/imgs/functors/applicative.png)

__Monad__ áp dụng cho một function có kết quả trả về là một context value và một context value khác.

Ví dụ ta có hàm `half` được định nghĩa như sau:

{% highlight haskell %}
half x = if even x
           then Just (x `div` 2)
         else Nothing
{% endhighlight %}

![half explanation](http://adit.io/imgs/functors/half.png)

Thế nếu áp dụng một context value cho hàm `half` thì sao?

{% highlight haskell %}
> half (Just 10)
ERROR!!!!
{% endhighlight %}

![half \(Just 10\)](http://adit.io/imgs/functors/half_ouch.png)

typeclass __Monad__ định nghĩa hàm `>>=` thực hiện yêu cầu trên

{% highlight haskell %}
> Just 3 >>= half
Nothing
> Just 10 >>= half
Just 5
> Nothing >>= half
Nothing
{% endhighlight %}

Signature của `>>=` như sau:

{% highlight haskell %}
class Monad m where
  (>>=) :: m a -> (a -> m b) -> m b
{% endhighlight %}

![>>= signature](http://adit.io/imgs/functors/bind_def.png)

Maybe định nghĩa `>>=` như sau:

{% highlight haskell %}
instance Monad Maybe where
  Nothing >>= f = Nothing
  Just a >>= f = f a
{% endhighlight %}

Ta có thể kết hợp liên tiếp `>>=` như sau:

{% highlight haskell %}
> Just 20 >>= half >>= half >>= half
Nothing
{% endhighlight %}

![Just 20 >>= half >>= half >>= half](http://adit.io/imgs/functors/monad_chain.png)

### Monad áp dụng cho datatype IO

Trong Haskell ta có hàm `getLine`: nhận input từ console trả về một `String` được gói trong context `IO`

{% highlight haskell %}
getLine :: IO String
{% endhighlight %}

![getLine :: IO String](http://adit.io/imgs/functors/getLine.png)

Hàm `readFile`: input một chuỗi(tên file) và trả về một String được gói trong context `IO`

{% highlight haskell %}
readFile :: FilePath -> IO String
{% endhighlight %}

> Trong Haskell datatype FilePath chính là alias của String

![readFile :: FilePath -> IO String](http://adit.io/imgs/functors/readFile.png)

Hàm `putStrLn`: input một `String`, in chuỗi đó ra console, trả về `IO ()`

{% highlight haskell %}
putStrLn :: IO ()
{% endhighlight %}

![putStrLn :: IO](http://adit.io/imgs/functors/putStrLn.png)

Do `IO` cũng là một Monad nên ta có thể áp dụng `>>=` vào các function trên như sau:

{% highlight haskell %}
getLine >>= readFile >>= putStrLn
{% endhighlight %}

Kết quả là chuỗi hành động sau:

- Nhận input file name từ console
- Đọc file đó
- In nội dung file đó ra console

![monad IO](http://adit.io/imgs/functors/monad_io.png)

Haskell cung cấp cú pháp `do` để làm công việc nối nhiều function __IO__ lại với nhau như trên.

{% highlight haskell %}
foo = do
  fileName <- getLine
  fileContent <- readFile fileName
  putStrLn fileContent
{% endhighlight %}

## Tóm lại

1. Functor là là một kiểu dữ liệu định nghĩa typeclass Functor
2. Applicative là kiểu dữ liệu định nghĩa typeclass Applicative
3. Monad là kiểu dữ liệu định nghĩa typeclass Monad
4. `Maybe` định nghĩa cả 3 typeclass Functor, Applicative, Monad. Do đó có thể dùng `fmap`, `<$>`, `<*>`, `>>=` với `Maybe`

Điểm khác biệt của các typeclass trên là gì?

![recap](http://adit.io/imgs/functors/recap.png)

- __functor__: áp dụng một function vào một context value thông qua hàm `fmap` hoặc `<$>`
- __applicative__: áp dụng một context function vào một context value thông qua hàm `<*>`
- __monad__: áp dụng một function trả về context value vào một context value thông qua hàm `>>=`
