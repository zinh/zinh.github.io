---
layout: post
title:  "Giới thiệu module Rails Concern"
date:   2014-11-30 00:03:04
summary: Module Concern của Rails.
categories: lucene
---

Kể từ bản Rails 4, một thư mục mặc định được tạo ra mỗi khi tạo project mới, đó là thư mục concerns. Ta sẽ tìm hiểu về module concern trong bài viết này.

But first, let's return to Ruby's realm

### Module và included callback

Ruby cung cấp một hàm callback có tên `included`. Hàm callback này sẽ được gọi mỗi khi module được included vào một module hoặc class khác. Signature của `included` như sau:

```
included(othermod)
```

Ví dụ sau được trích từ document của [Ruby](http://ruby-doc.org/core-1.9.3/Module.html#method-i-included)

```
module A
  def A.included(mod)
    puts "#{self} included in #{mod}"
  end
end

module Enumerable
  include A
end
```

Ứng dụng của included

```ruby
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
```

Logic chung của Entry và Comment được move thành một module riêng:

```ruby
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
```

### Class methods

Khi một module được include vào một class, class đó sẽ access được các instance method được định nghĩa trong module đó. Tuy nhiên, instance lại không được include. Do đó đoạn code sau sẽ sinh lỗi:

```
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
```

Một cách để workaround chính là sử dụng included

```
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
```

### Module Concern

Immplement sẵn các hàm extend class method, instance method như trên.

```ruby
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
```