---
layout: post
title: "Biểu thức chính quy và automata"
date: 2023-09-09 00:16:00
summary: Một vài ghi chú về biểu thức chính quy(regular expression) và automata
mermaid: true
description: một vài ghi chú nhỏ về biểu thức chính quy và automata
categories: compiler
---

Một số ghi chép về ngôn ngữ hình thức(formal language), ngữ pháp(grammar), regular language và automata.

## Formal language & BNF grammar
Ngôn ngữ hình thức có thể hiểu như một mô hình để mô tả ngôn ngữ(ví dụ tiếng Anh, ngôn ngữ lập trình Python, ...). Một ngôn ngữ hình thức(thường ký hiệu L) bao gồm các thành phần:
- Bộ ký tự: tập hợp các ký tự trong mô hình, các ký tự sẽ được nhóm lại tạo thành từ(word) hoặc token. Tập các ký tự thường được ký hiệu bằng Σ.
- Grammar: tập hợp các quy luật để quyết định xem một chuỗi các ký tự có thuộc mô hình hay không.

__Ví dụ ①__: tập ký tự `Σ = { a }` (chỉ bao gồm một ký tự a), và grammar: các chuỗi có chiều dài là một số chẵn. Như vậy ngôn ngữ của ta bao gồm các chuỗi `L = { aa, aaaa, aaaaaa, ... }`, dĩ nhiên chuỗi `aaa, a ∉ L`

Một ví dụ khác: tập ký tự của tiếng Việt `Σ = { a, ă, â, b, c, d, đ, ... y  }`, L(tiếng Việt) = { tất cả các câu đúng ngữ pháp tiếng Việt}

BNF(Backus–Naur form): quy tắc ngữ pháp mà ghi bằng lời như ví dụ trên rất dài dòng và không chính xác. Vì vậy các quy tắc thường được diễn tả bằng BNF. Quy tắc ngữ pháp viết theo BNF như sau:

```
<symbol> ::= __expression__
```

Trong đó symbol là một non-terminal symbol(hay variable, ký hiệu chưa kết thúc) và expression là một hoặc nhiều terminal(ký hiệu kết thúc)/non-terminal symbol.

Ký hiệu ::= có nghĩa thay thế symbol bên vế trái bằng expression ở vế phải. 

Một số khái niệm khác liên quan đến BNF:

- ε: ký hiệu cho một chuỗi rỗng.
- Start symbol

__Ví dụ ②:__ quay lại với ví dụ ① ta có thể mô tả grammar bằng BNF như sau:

```
S ::= ε | aaS

Một cách viết khác:
S -> ε | aaS
```

Trong BNF, nếu có nhiều lựa chọn, ngăn cách các lựa chọn bằng ký hiệu \|. Như ở ví dụ trên, S có thể được thay thế bằng một chuỗi rỗng(ε) hoặc một chuỗi bắt đầu bằng 2 ký tự aa.

Cũng ở ví dụ trên, S là một non-terminal symbol(có thể được thay thế bởi một biểu thức khác), `aa` là terminal symbol.

## Bài toán parsing

Bài toán parsing được phát biểu như sau:

Cho tập ký tự Σ, L được mô tả bằng bộ ngữ pháp G, s là một chuỗi bất kỳ tạo thành bởi các ký tự thuộc Σ. Xác định s có thuộc L hay không.

Để giải bài toán parsing, trước tiên cần phân loại L dựa theo Chomsky hierarchy.

## Chomsky hierarchy

Chomsky đã đề xuất phân chia ngôn ngữ thành các cấp bậc hay còn gọi là Chomsky Hierarchy. Có 4 cấp bậc trong Chomsky Hierarchy:

__Regular language(ngôn ngữ chính quy)__: bộ ngữ pháp của ngôn ngữ chính quy có các ràng buộc sau:

- A -> a (vế phải có 1 terminal symbol)
- A -> aB (vế phải có tối đa 1 nonterminal symbol và symbol này phải nằm ngoài cùng, trái hoặc phải).

Trong đó:
- A, B: nonterminal symbol
- a: terminal symbol

__Context-free language(ngôn ngữ phi ngữ cảnh)__: bộ ngữ pháp của ngôn ngữ phi ngữ cảnh(context-free grammar hay CFG) có các ràng buộc sau:

- A -> α (vế trái chỉ có 1 non-terminal symbol)

Trong đó:
- A: nonterminal symbol
- α: một hoặc nhiều terminal/nonterminal symbol

Ví dụ ③:

```
<Câu> → <Chủ ngữ> <Động từ> <Vị ngữ> | <Chủ ngữ> <Động từ>
<Chủ ngữ> → <Danh từ>
<Danh từ> → tôi | bạn | anh | em ...
```

__Context-sensitive__: ngữ pháp có ràng buộc sau

- αAβ -> αγβ

Trong đó:
- A: nonterminal symbol
- α, γ, β: một hoặc nhiều terminal, nonterminal symbol

__Recursively enumerable__: hầu như không có ràng buộc gì đối với grammar rule của ngôn ngữ này.

- α -> γ

Trong đó:

- α, γ: một hoặc nhiều terminal/nonterminal symbol. α ≠ ε

__Trong Chomsky hierarchy, { Regular Language } ⊂ { Context-free } ⊂ { Context-sensitive } ⊂ { Recursively enumerable }__

![Chomsky hierarchy](https://upload.wikimedia.org/wikipedia/commons/9/9a/Chomsky-hierarchy.svg)

> Noam Chomsky là một nhà ngôn ngữ học đã có những đóng góp quan trọng trong lý thuyết ngôn ngữ hình thức và được sử dụng rộng rãi trong bộ môn trình biên dịch(compiler) của khoa học máy tính.

## Regular expression

Vẫn dùng tập ký tự Σ, các symbol sau là biểu thức chính quy:
- ∅: tập rỗng
- ε: chuỗi rỗng, L(ε) = { ε }
- a: một ký tự thuộc Σ, L(a) = { a }

Nếu R và S là 2 biểu thức chính quy, các phép toán sau cũng tạo ra biểu thức chính quy:
- Phép nối (RS): ví dụ R = { a, aa }, S = { bb, bbbb }, `(RS) = { abb, abbbb, aabb, aabbbb }`. Có thể hiểu phép nối như tích Decartes giữa 2 tập R và S. `(RS) = R x S`.
- Phép hợp(R \| S): ví dụ với R, S như trên `(R \| S) = {a, aa, aaa, bb, bbbb, ...}`. Có thể hiểu `(R | S) = R ∪ S`.
- Kleene star(R*): `R* = {ε} ∪ R ∪ (RR) ∪ (RRR) ∪ (RRRR) ∪ ... ∪ (R^n)`

Một số ví dụ:
- ab: L = { ab }
- (aa)\* : L = { ε, aa, aaaa, aaaaaa, ... }
- a\*(bb)\*: L = { ε, a, aa, aaa, bb, bbbb, abb, aabb, ...}

> regex trong ngữ cảnh regular language rất khác với regex thực tế trong ngôn ngữ lập trình, một phần do regex trong ngôn ngữ lập trình đã được thêm nhiều extension/syntactic sugar, ví dụ: [a-z], a{n,m}, look-ahead, look-behind, backreferences, ... Vì vậy, regex trong các ngôn ngữ lập trình được hiện thực phức tạp hơn regex trong regular language rất nhiều.

## Finite automata

Phương pháp để mô hình hoá một quá trình tính toán. Finite automata bao gồm các thành phần:

- Σ: tập ký tự, input sẽ là chuỗi chứa các ký tự thuộc tập này.
- States: tập các trạng thái(hữu hạn), nên được gọi là Finite Automata.
- δ: hàm nhận tham số là trạng thái hiện tại + ký tự input, sẽ cho ra trạng thái tiếp theo.
- q: tập các trạng thái bắt đầu
- F: tập các trạng thái kết thúc

Để cho dễ hiểu Finite automata thường được biểu diễn bằng dạng graph.
Trở lại ví dụ 1, ta có
- Σ = { a }
- States = { Start, S1, S2 }
- q = { Start }
- F = { S2 }
- δ(Start, a) = S1, δ(S1, a) = S2, δ(S2, a) = S1
- $: ký tự đặc biệt đánh dấu kết thúc chuỗi

Có thể dùng bảng(transition table) để mô tả hàm δ như sau:

|δ|a|$|
|Start|S1|End|
|S1|S2||
|S2|S1|End|

```mermaid
stateDiagram-v2
  direction LR
  [*] --> S1: a
  [*] --> [*]: $
  S1 --> S2: a
  S2 --> S1: a
  S2 --> [*]: $
```

Automaton này sẽ chấp nhận các input chứa một số chẵn các ký tự a như aa, aaaa.

Ngược lại, chuỗi aaa sẽ không được chấp nhận vì khi xử lý đến ký tự a thứ ba, ta đến trạng thái S1, nhưng do S1 không phải là 1 trạng thái kết thúc cũng như không còn input nào để xử lý => chuỗi không được chấp nhận bởi automaton này.

Định nghĩa ở trên còn được gọi là Deterministic Finite Automata(DFA), ta còn có Nondeterministic Finite Automata(NFA). NFA tương tự như DFA nhưng có thêm một khái niệm ε-transition. Lấy một ví dụ như sau:

```mermaid
stateDiagram-v2
  direction LR
  [*] --> S1: a
  S1 --> S2: ε
  S1 --> S3: a
  S3 --> S1: a
  S2 --> [*]: a
  S3 --> [*]: $
```

Với ε-transition khi đến một trạng thái ta có thể đi đến trạng thái tiếp theo mà không cần nhận thêm input. Ở ví dụ trên, khi đến trạng thái S1 ta có thể đồng thời đi đến S2(thông qua ε-transition) hoặc S3(nếu input tiếp theo là a). Do ε-transition cho phép di chuyển đồng thời đến nhiều trạng thái, nên tại một thời điểm ta có thể ở nhiều trạng thái khác nhau(nondeterministic). Transition table cho ví dụ trên:

|δ|a|$|
|Start|S1||
|S1|{ S3, End }||
|S2|End||
|S3|S1|End|

Một định lý quan trọng của lý thuyết Automata là NFA và DFA tương đương nhau, theo đó ta có thể dùng các phép biến đổi để chuyển 1 NFA thành 1 DFA(và ngược lại). Thuật toán chuyển đổi qua lại giữa NFA và DFA được gọi là Powerset construction.

Khi chuyển đổi NFA -> DFA số lượng trạng thái có thể tăng lên theo cấp số mũ, nghĩa là nếu NFA có n trạng thái, khi chuyển thành DFA có tối đa 2^n trạng thái(đồng nghĩa sẽ tốn nhiều bộ nhớ hơn). Tuy nhiên về mặt hiện thực, DFA có thuật toán hiện thực hiệu quả hơn, NFA do có ε-transition nên cần dùng back-track. Tóm lại:

- NFA: n states, O(mn) trong đó m: số states, n: chiều dài input
- DFA: 2^n states, O(n)

## Định lý Kleene

Định lý Kleene đã cho một kết quả đáng ngạc nhiên về mối liên hệ giữa ngôn ngữ chính quy, biểu thức chính quy và finite automata, theo đó các khái niệm này là tương đương với nhau. Nghĩa là một biểu thức chính quy sẽ tương đương với 1 finite automata, bộ ngữ pháp của ngôn ngữ chính quy tương đương với một biểu thức chính quy.

Nhờ định lý Kleene ta có thể dùng finite automata để hiện thực bài toán matching bằng regular expression.

Trở lại với ví dụ 1 ta có:

Grammar: __S ::= ε \| aaS__

Regular expression: __(aa)*__

DFA:

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Start
  Start --> S1: a
  Start --> [*]: $
  S1 --> S2: a
  S2 --> S1: a
  S2 --> [*]: $
```

Cả 3 đều mô ta một regular language trên tập Σ = { a } với các chuỗi có chiều dài là một số chẵn.

Từ định lý Kleene, ta có thể hiểu tại sao không thể dùng regular expression để mô tả L = { tập các cặp dấu (, ) lồng nhau }. Quy tắc ngữ pháp cho tập này  `S = () | (S)` (không theo 2 ràng buộc của regular grammar) => L là context-free language.

> Stephen Cole Kleene là một nhà toán học người Mỹ, học trò của Alonzo Church(tác giả lambda calculus). Kleene cùng với Rózsa Péter,  Alan Turing,  Emil Post có nhiều đóng góp cho lý thuyết tính toán(computation theory), đặt nền móng toán học cho khoa học máy tính.

Trở lại với bài toán parsing cho regular language, trước tiên ta có regular grammar hoặc regular expression, dùng phép biến đổi để xây dựng 1 NFA cho regular expression này, sau đó chuyển NFA sang DFA, cuối cùng dùng table để implement DFA.
