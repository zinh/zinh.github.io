---
layout: post
title:  "Giới thiệu module Rails Concern"
date:   2014-11-30 00:03:04
summary: Giới thiệu về module Concern của Rails. Một module rất đơn giản nhưng đôi khi rất hữu dụng khi refactor các phần code dùng chung của model.
categories: rails
---

Kể từ bản Rails 4, một thư mục mặc định được tạo ra mỗi khi tạo project mới, đó là thư mục concerns. Ta sẽ tìm hiểu về module concern trong bài viết này.

But first, let's return to Ruby's realm

### Module và included callback

Ruby cung cấp một hàm callback có tên `included` cho module. Hàm callback này sẽ được gọi mỗi khi module được included vào một module hoặc class khác. Cách dùng `included` rất đơn giản, ví dụ sau được trích từ document của [Ruby](http://ruby-doc.org/core-1.9.3/Module.html#method-i-included){:target="_blank"}{:rel="nofollow"}

{% highlight ruby %}
# test.rb
module A
  def A.included(mod)
    puts "#{self} included in #{mod}"
  end
end

module Enumerable
  include A
end
# 
{% endhighlight %}

Khi chạy file `test.rb` trên sẽ được kết quả:

    $ ruby test.rb
    A included in Enumerable

`included` có thể được dùng để tách các phần logic giống nhau vào một module dùng chung. Chằng hạn trong ví dụ sau ta có 2 class `Entry` và `Comment`, cả 2 class đều định nghĩa các hàm như `posted_at` và cùng gọi các helper như `validates_presence_of`

{% highlight ruby %}
class Entry
  validates_presence_of :user_id
  
  # formated post time
  def posted_at
    created_at.strftime("%Y/%m/%d")
  end
end

class Comment
  validates_presence_of :user_id
  
  # formated post time
  def posted_at
    created_at.strftime("%Y/%m/%d")
  end
end
{% endhighlight %}

Dùng `included` ta dễ dàng move các logic này vào một module riêng, cụ thể như sau:

{% highlight ruby %}
module Postable
  def self.included(base)
    base.class_eval do
      validates_presence_of :user_id
    end
  end
  
  def posted_at
    created_at.strftime("%Y/%m/%d")
  end
end

class Entry
  include Postable
end

class Comment
  include Postable
end
{% endhighlight %}

### Class methods

Khi một module được include vào một class, mặc định class đó sẽ access được các instance method được định nghĩa trong module đó nhưng lại không gọi được các class method. Chẳng hạn như hàm `find_by_user_id` trong ví dụ sau:

{% highlight ruby %}
module Postable
  def posted_at
    created_at.strftime("%Y/%m/%d")
  end
  
  def self.find_by_user_id
    # ...
  end
end

class Entry
  include Postable
end

class Comment
  include Postable
end

# Entry.new.posted_at -> OK
# Entry.find_by_user_id(1) -> NoMethodError
{% endhighlight %}

Một cách để workaround chính là sử dụng callback `included`

{% highlight ruby %}
module Postable
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    def find_by_user_id
      # ...
    end
  end
end
{% endhighlight %}

Trong ví dụ trên ta dùng function `base` của class/module để extend các class method. Sử dụng cách này, các class/module include `Postable` sẽ access được hàm `find_by_user_id` đã được định nghĩa.

### Module Concern

Các ví dụ ở trên chính là cách hoạt động của module `Concern`. Với việc sử dụng `Concern` ta viết lại module `Postable` đơn giản như sau:

{% highlight ruby %}
require 'active_support/concern'

module Postable
  extend ActiveSupport::Concern

  included do
    validates_presence_of :user_id
  end
  
  module ClassMethods
    def find_by_user_id
      # ...
    end
  end
end

class Entry
  include Postable
end

class Comment
  include Postable
end
{% endhighlight %}

Ngoài ra, module concern còn giúp giải quyết vấn đề dependency. Như trong ví dụ sau, module B phụ thuộc vào module A

{% highlight ruby %}
module A
  def self.included(base)
    base.class_eval do
	  def self.method_of_module_a
	    # ...
	  end
	end
  end
end

module B
  def self.included(base)
    base.method_of_module_a
  end
end

class C
  include A
  include B
end
{% endhighlight %}

Ta thấy class C chỉ muốn sử dụng module B, nhưng lại phải include thêm module A(do B phụ thuộc vào hàm `method_of_module_a` của A).
Nhưng với việc sử dụng Concern vấn đề dependency đã được giải quyết. Ta viết lại đoạn code trên như sau:

{% highlight ruby %}
require 'active_support/concern'

module A
  extend ActiveSupport::Concern
  included do
    def self.method_of_module_a
      # ...
    end
  end
end

module B
  extend ActiveSupport::Concern
  include A
  
  included do
  self.method_of_module_a
  end
end

module C
  include B
end
{% endhighlight %}

Chi tiết về module Concern có thể tham khảo tại:

[http://api.rubyonrails.org/classes/ActiveSupport/Concern.html](http://api.rubyonrails.org/classes/ActiveSupport/Concern.html){:target="_blank"}{:rel="nofollow"}

[https://github.com/rails/rails/blob/master/activesupport/lib/active_support/concern.rb](https://github.com/rails/rails/blob/master/activesupport/lib/active_support/concern.rb){:target="_blank"}{:rel="nofollow"}
