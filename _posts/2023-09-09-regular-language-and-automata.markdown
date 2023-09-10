---
layout: post
title: "Biểu thức chính quy và automata"
date: 2023-09-09 00:16:00
summary: Một vài ghi chú về biểu thức chính quy(regular expression) và automata
description: một vài ghi chú nhỏ về biểu thức chính quy và automata
categories: compiler
---

Ngôn ngữ hình thức(formal language), ngữ pháp(grammar) và BNF

Ngôn ngữ hình thức có thể hiểu như một mô hình để mô tả ngôn ngữ(ví dụ tiếng Anh, ngôn ngữ lập trình Python, ...). Một ngôn ngữ hình thức(thường ký hiệu L) bao gồm các thành phần:
- Bộ ký tự: tập hợp các ký tự trong mô hình, các ký tự sẽ được nhóm lại tạo thành từ(word) hoặc token. Tập các ký tự thường được ký hiệu bằng Σ.
- Grammar: tập hợp các quy luật để quyết định xem một chuỗi các ký tự có thuộc mô hình hay không.

Ví dụ: tập ký tự `Σ = { a }` (chỉ bao gồm một ký tự a), và grammar: các chuỗi có chiều dài là một số chẵn. Như vậy ngôn ngữ của ta bao gồm các chuỗi `{ aa, aaaa, aaaaaa, ... }`, dĩ nhiên chuỗi `aaa, a ∉ L`

BNF(Backus–Naur form): quy tắc ngữ pháp mà ghi bằng lời như ví dụ trên rất dài dòng và không chính xác. Vì vậy các quy tắc thường được diễn tả bằng BNF.

Ví dụ: quay lại với ví dụ 1 ta có thể mô tả grammar bằng BNF như sau:

```
S ::= ε | aaS
```

Ký hiệu ::= có nghĩa thay thế symbol bên trái bằng bên phải, nếu có nhiều lựa chọn, ngăn cách các lựa chọn bằng ký hiệu |.
Một số khái niệm liên quan đến BNF:

- Non-terminal symbol: symbol có thể được thay thế bởi một hay nhiều symbol khác.
- Terminal symbol: symbol không thể thay thế được nữa.
- ε: ký hiệu cho một chuỗi rỗng.
- Start symbol: 

`::=` thường được thay thế bằng →, các quy tắc grammar cũng thường được gọi là production rule(nghĩa là nếu đi từ vế trái ta sẽ sinh ra những symbol ở vế phải), ngược lại nếu đi từ vế phải sang trái ta có reduction(nghĩa là thay thế các symbol của vế phải bằng các symbol vế trái).

Một ví dụ đơn giản cho bộ quy tắc ngữ pháp sau:

E -> S V O
S -> noun
V -> verb
O -> noun

# Chomsky hierarchy

Noam Chomsky là một nhà ngôn ngữ học đã có những đóng góp quan trọng trong lý thuyết ngôn ngữ hình thức và được sử dụng rộng rãi trong bộ môn trình biên dịch(compiler) của khoa học máy tính. Một trong số đó là Chomsky hierarchy(hệ thống cấp bậc Chomsky, dịch nghe dài nên gọi Chomsky hierarchy cho gọn)

Trong các cấp bậc này Chomsky phân chia ngôn ngữ ra 4 cấp bậc:

Regular language(ngôn ngữ chính quy): bộ ngữ pháp của ngôn ngữ chính quy có các ràng buộc sau:
- A -> a
- A -> aB

Context-free language(ngôn ngữ phi ngữ cảnh): bộ ngữ pháp của ngôn ngữ phi ngữ cảnh(context-free grammar hay CFG) có các ràng buộc sau
- A -> α (vế trái chỉ có 1 non-terminal symbol)

Context-sensitive:
- αAβ -> αγβ

Recursively enumerable: hầu như không có ràng buộc gì đối với grammar rule của ngôn ngữ này.

# Regular language

Như nói ở trên bộ ngữ pháp của regular language khá đơn giản với 2 ràng buộc:
A -> a
A -> aB

- có nhiều nhất 1 non-terminal symbol ở vế phải
- nếu có 1 non-terminal symbol, nó sẽ nằm sau cùng.

Một cách khác để định nghĩa regular language: regular expression(biểu thức chính quy)

## Regular expression

Vẫn dùng tập ký tự Σ, các symbol sau là biểu thức chính quy:
- ∅: tập rỗng
- ε: chuỗi rỗng
- a: một ký tự thuộc Σ

Nếu R và S là 2 biểu thức chính quy, các phép toán sau cũng tạo ra biểu thức chính quy:
- Phép nối(RS)
- Phép hợp(R \| S)
- Kleene star(R*)

Một số ví dụ:
- (aa)*
- (1 \| 0)*

## Finite automata

## Định lý Kleene

Định lý Kleene đã cho một kết quả đáng ngạc nhiên về mối liên hệ giữa ngôn ngữ chính quy, biểu thức chính quy và finite automata, theo đó các khái niệm này là tương đương với nhau. Nghĩa là một biểu thức chính quy sẽ tương đương với 1 finite automata, bộ ngữ pháp của ngôn ngữ chính quy tương đương với một biểu thức chính quy.

Nhờ định lý Kleene ta có thể dùng finite automata để hiện thực matching bằng regular expression.
