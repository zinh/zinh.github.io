---
layout: post
title:  "Giới thiệu về lập trình hàm"
date:   2014-11-30 00:03:04
summary: functional programming 
categories: ruby
---

lập trình hàm giải quyết vấn đề về side effect. Ví dụ:

```ruby
  @a = 10
  def increament
    @a += 1
  end
```

```ruby
  def increament(a)
    a + 1
  end
```

Sử dụng map - reduce

Hàm map của một array object nhận vào một block vả trả về một mảng với các phần tử được xử lý bởi block đó.

Ví dụ dưới đây dùng hàm map để trả về chiều dài của các chuỗi trong một mảng.

```ruby
  names = ['harry', 'weasley', 'granger']
  names.map{|name| name.length}
  # [5, 7, 7]
```

Hàm reduce
Hàm reduce của class enumerable nhận input là một block, execute block đó với một phần tử và gán kết quả vào một biến memo.
Ví dụ dưới đây tính tổng các phẩn tử của một mảng dùng reduce.

```
  a = [1, 2, 3, 4, 5, 6, 7]
  a.reduce{|memo, element| memo += element}
```

Chương trình dưới đây mô phỏng đua giữa 3 chiếc xe. ở mỗi bước chương trình in ra chặng đường 3 xe đã đi qua.

Ví dụ:

imprerative program:

```ruby
time = 5
car_positions = [1,1,1]

while time > 0
  time -= 1
  puts ''
  car_positions.each_with_index do |_, index|
    car_positions[i] += 1 if rand > 0.3 
  end
  puts '-' * car_positions[i]
end
```

Chia thành function:

```
def move_cars
  @car_positions.each_with_index do |_, index|
    @car_positions[i] += 1 if rand > 0.3 
  end
end

def draw_car(car_position)
  puts '-' * car_position
end

def run_step_of_car
  @time -= 1
  move_cars
end

def draw
  puts ''
  car_positions.each{|car_position| draw_car(car_position)}
end

while time > 0
  run_step_of_car
  draw
end
```
