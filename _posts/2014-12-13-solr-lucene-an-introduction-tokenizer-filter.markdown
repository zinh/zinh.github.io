---
layout: post
title:  "Giới thiệu về tokenizer và filter của Lucene/Solr"
date:   2014-11-30 00:03:04
summary: Tiếp theo series giới thiệu về Solr/Lucene, bài viết này giới thiệu về tokenzer và filter, hai thành phần quan trọng của Solr/Lucene
categories: lucene
---

Trong [bài viết trước](http://zinh.github.io/lucene/2014/11/23/solr-lucene-an-introduction.html) ta đã tìm hiểu về cấu trúc của Inverted Index được sử dụng để index các document. Để nhắc lại, ta có 1 ví dụ về inverted index đơn giản như sau:

Yêu cầu: cần lập inverted index cho 3 document sau:

    D[1] = "The quick brown fox"
    D[2] = "What does the fox say"
    D[3] = "What if"
	
Trước tiên các document sẽ được tách thành các từ đơn(term) như sau:

    D[1] = {The, quick, brown, fox}
    D[2] = {What, does, the, fox, say}
    D[3] = {What, if}
	
*Inverted Index* được tạo thành bằng các term, cùng với id của các document chứa term đó.

    the: {1, 2}
    quick: {1}
    brown: {1}
    fox: {1, 2}
    what: {2, 3}
    does: {2}
    say: {2}
    if: {3}
	
Ta thấy một bước khá quan trọng trong inverted index chính là tách một document thành các term(hay còn gọi là token). Trong Lucene/Solr quá trình phân tích này thường được thực hiện qua 3 bước:

Sau đây, ta sẽ đi vào tìm hiểu các bước trên

### Char Filter

Đây là bước đầu tiên của quá trình phân tích. Dữ liệu trước khi được tách thành các token sẽ được tiền xử lý chẳng hạn như tách bỏ các thẻ html của một webpage, chỉ để lại nội dung của các tag. Bộ char filter thường được sử dụng nhất chính là HTMLStripCharFilter.

Ví dụ:

    "my <a href="www.foo.bar">link</a>"     -> my link
    <br>hello<!--comment-->                 -> hello

Ngoài ra còn có các bộ char filter khác như: _PatternReplaceCharFilter_(thay thế một pattern bằng một pattern khác), _MappingCharFilter_(map một kí tự này thành kí tự khác, thường được sử dụng để chuyển từ có dấu sang không dấu)

### Tokenizer

Sau khi qua tiền xử lý, dữ liệu sẽ được tách thành các token. Quá trình phân tích này được gọi là _Tokenizer_.

Ở ví dụ trên, ta đã làm quen với một tokenizer đơn giản. Tokenizer này tách token theo kí tự dấu cách(whitespace).

Ví dụ document `d = "WhitespaceTokenizer creates tokens of characters separated by splitting on whitespace"` sẽ sinh ra các token sau: `{WhitespaceTokenizer, creates, tokens, of, characters, separated, by, splitting, on, whitespace}`

Bộ tokenizer này trong Lucene có tên là *WhitespaceTokenizer*.

Ngoài bộ WhitespaceTokenizer, Lucene còn cung cấp rất nhiều bộ tokenizer khác với các qui tắc tách token từ đơn giản đến phức tạp. Sau đây là một số bộ tokenizer thường được sử dụng nhất

#### LetterTokenizer

Tương tự như bộ WhitespaceTokenizer, LetterTokenizer tách token theo các dấu(whitespace, dấu chấm, phẩy, ...)

Ví dụ:

	"Any non-letter characters will be discarded" -> {Any, non, letter, characters, will, be, discarded}

#### LowerCaseTokenizer

Bộ này tương tự như bộ LetterTokenizer nhưng nâng cao hơn chút bằng việc chuyển các kí tự in hoa thành chữ thường.

Ví dụ:

	"Creates tokens by lowercasing all letters and dropping non-letters" -> {creates, tokens, by, lowercasing, all, letters, and, dropping, non, letters}
	
#### StandardTokenizer

Đây là bộ tokenizer thường được sử dụng nhất. Bao gồm rất nhiều qui tắc tách từ phức tạp được liệt kê trong tài liệu [Unicode standard annex UAX#29](http://unicode.org/reports/tr29/#Word_Boundaries)

Ví dụ:

	"I.B.M. 8.5 can't!!!" -> {I.B.M. , 8.5 , can't}
	
### Token Filter

Bước cuối cùng của quá trình phân tích được gọi là Token filter. Sau khi dữ liệu được tách thành token sẽ được chuyển đến các bộ Token filter có nhiệm vụ xử lý trên các token này như lọc bỏ các token không cần thiết, map một token thành các token khác... Trái với tokenizer, ta có thể kết hợp sử dụng nhiều bộ filter cùng lúc theo cơ chế pipeline: output của filter này là input của filter tiếp sau. Cần chú ý input của token filter là từng token một.

Lucene cung cấp sẵn rất nhiều bộ filter đáp ứng gần như đầy đủ các yêu cầu xử lý từ đơn giản đến phức tạp nhất. Sau đây là  một số bộ filter thường được sử dụng nhất

#### LowerCaseFilter

Đơn giản chuyển từ ký tự in hoa sang ký tự thường.

Ví dụ:

	"I.B.M.", "Solr" ==> "i.b.m.", "solr"
	
#### StopFilterFactory

Loại bỏ các token theo một danh sách "blacklist" cho trước. Các token này thường là các stopword, các từ không có ý nghĩa nhiều về mặt ngữ nghĩa.

Chẳng hạn trong tiếng Anh, các từ sau được xem là stop word: "the", "a", "an", "to", "with"...

Hoặc trong tiếng Việt: "thì", "là", "mà", "tuy", "nhưng"...

#### KeepWordFilter

Ngược với StopFilterFactory, KeepWordFilter sẽ loại bỏ các token không nằm trong danh sách whitelist cho trước.

#### EdgeNGramTokenFilter

Sinh ra bộ n-gram từ một token.

Ví dụ từ input token "lucene" sẽ sinh ra các token: "l", "lu", "luc", "luce", "lucen", "lucene"

Tham khảo thêm về ứng dụng của n-gram trong xử lý ngôn ngữ tại [Wikipedia](http://en.wikipedia.org/wiki/N-gram)

#### SynonymFilter

Đây là bộ filter rất thường được sử dụng trong các ứng dụng tìm kiếm. Bộ filter này sẽ map token theo một từ điển đồng nghĩa được định sẵn. Mục đích của việc map này giúp ta có thể tìm kiếm với các từ đồng nghĩa.

Ví dụ:

Ta có bộ từ điển như sau:

	dictionary: sài gòn, tp hcm, thành phố hồ chí minh, tp hồ chí minh, tphcm -> tphcm
	
Khi đó tất cả các token như "sài gòn", "tp hcm" đều sẽ được map thành "tphcm". Khi đó, nếu document A có chứa token "tphcm" khi tìm bằng các từ khóa như "sài gòn", "tp hồ chí minh" đều sẽ trả về A.

Bên cạnh đó, ta còn có thể map ngược như sau:

	dictionary: tphcm -> sài gòn, tp hcm, thành phố hồ chí minh, tp hồ chí minh, tphcm
	
Khi đó token "tphcm", sau khi qua bộ filter sẽ sinh ra các token đồng nghĩa với nó. Nếu ta tìm kiếm với từ khóa "tphcm" sẽ nhận được kết quả là tất các document chứa các token đồng nghĩa như "sài gòn", "tp hcm", "tp hồ chí minh"...
