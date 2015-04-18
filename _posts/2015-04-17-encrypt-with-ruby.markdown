---
layout: post
title:  "Mã hóa trong Ruby với thư viện openssl"
date:   2015-04-17 00:03:04
summary: Gần đây mình có nhu cầu push một số data hơi nhạy cảm lên các public repo. Nhưng để ở plain text thì thấy không an tâm lắm, nên trong bài viết này, ta sẽ tìm hiểu về cách mã hóa trong Ruby sử dụng thư viện openssl. 
description: data encryption, decryption with Ruby using built-in openssl library
categories: ruby
---

Gần đây mình có nhu cầu push một số data hơi nhạy cảm lên các public repo. Nhưng để ở plain text thì thấy không an tâm lắm, nên ta sẽ tìm cách mã hóa chúng. Trong bài viết này, mình xin giới thiệu cách sử dụng module Cipher của thư viện openssl được cung cấp mặc định trong Ruby.

Document của openssl khá đẩy đủ, cung cấp các ví dụ minh họa rõ ràng. Chẳng hạn để mã hóa ta có thể dùng snippet sau:

{% highlight ruby %}
data = "Very, very confidential data"

cipher = OpenSSL::Cipher.new('AES-128-CBC')
cipher.encrypt
key = cipher.random_key
iv = cipher.random_iv
{% endhighlight %}

Đọc đoạn code trên ta thấy một số keyword:

  - `AES-128-CBC`: thuât toán mã hóa được sử dụng. Ví dụ ở đây ta dùng thuật toán mã hóa đối xứng AES với chiều dài khóa 128 bit, dùng CBC mode. Để biết các thuật toán được openssl cung cấp ta có thể dùng hàm `OpenSSL::Cipher.ciphers`
  - `key`: khóa dùng để mã hóa/giải mã.
  - `iv`: vector khởi tạo(initialization vector)

Như vậy ta thấy trong đoạn code trên, khóa giải mã và vector khởi tạo đều được tạo random, đồng nghĩa với việc ta phải lưu trữ chúng ở đâu đó(để còn giải mã sau này). Nhưng tính mình thì hay quên, lưu lại rồi quên mất lưu ở đâu thì tiêu. Vì thế, mình tìm cách sinh ra khóa từ một chuỗi password, mỗi khi cần giải mã chỉ cần nhập chuỗi password này vào là có thể lấy lại được văn bản ban đâu.

Ở đây ta sẽ dùng module `PKCS5` để sinh khóa(thực ra là chuỗi hash của password dùng SHA-1) từ một password cho trước.

{% highlight ruby %}
password = "my password"
salt = OpenSSL::Random.random_bytes(16)
iter = 20_000
key_len = 16
key = OpenSSL::PKCS5.pbkdf2_hmac_sha1(pass, salt, iter, key_len)
{% endhighlight %}

Có một số tham số cần chú ý:

  - `password`: password dùng để tạo khóa.
  - `salt`: chuỗi salt được append vào password trước khi hash(chống dictionary attack)
  - `iter`: giá trị càng lớn thời gian sinh key sẽ càng lâu(chống brute force attack)
  - `key_len`: chiều dài khóa được sinh ra(128 bit), phải tương thích với thuật toán mã hóa(trong ví dụ trên là thuật AES 128 bit)

Để tạo lại khóa, ta cần truyền vào `salt` và `password`. Chuỗi `salt` có thể lưu trữ public cũng không vấn đề gì.

Đến đây ta có các thông số sau cần phải được lưu trữ lại(để dùng giải mã sau này)

  - `salt`
  - `iv`
  - `password`

`salt` và `iv` có thể lưu cùng với encrypted data, còn `password` dĩ nhiên phải nhớ, hoặc ghi ra đâu đó.

Đã có đủ các công cụ, ta có đoạn code dùng để mã hóa/giải mã như sau:

{% highlight ruby %}
# hàm mã hóa
def encrypt(password, salt, data)
  key = key_generator(password, salt)
  cipher = OpenSSL::Cipher.new('AES-128-CBC')
  cipher.encrypt
  cipher.key = key
  iv = cipher.random_iv
  encrypted = cipher.update(data) + cipher.final

  return {iv: iv, data: encrypted}
end

# hàm giải mã
def decrypt(password, salt, iv, encrypted_data)
  key = key_generator(password, salt)
  decipher = OpenSSL::Cipher::AES.new(128, :CBC)
  decipher.decrypt
  decipher.key = key
  decipher.iv = iv
  plain = decipher.update(encrypted_data) + decipher.final

  return plain
end

# hàm sinh key từ password
def key_generator(password, salt, key_length = 16)
  iter = 20000
  key = OpenSSL::PKCS5.pbkdf2_hmac_sha1(password, salt, iter, key_length)

  return key
end
{% endhighlight %}

Trong ví dụ sau, ta thử mã hóa, và giải mã một đoạn văn bản:


{% highlight ruby %}
salt = OpenSSL::Random.random_bytes(16)
password = "123456789"
data = "A very very sensitive data"
encrypted_data = encrypt(password, salt, data)

decrypted_data = decrypt(password, salt, encrypted_data[:iv], encrypted_data[:data])
puts decrypted_data
{% endhighlight %}

Reference:

[http://ruby-doc.org/stdlib/libdoc/openssl/rdoc/OpenSSL/Cipher.html](http://ruby-doc.org/stdlib/libdoc/openssl/rdoc/OpenSSL/Cipher.html){:target="_blank"}{:rel="nofollow"}

[http://ruby-doc.org/stdlib/libdoc/openssl/rdoc/OpenSSL/PKCS5.html](http://ruby-doc.org/stdlib/libdoc/openssl/rdoc/OpenSSL/PKCS5.html){:target="_blank"}{:rel="nofollow"}

