---
layout: post
title: "Parsing context-free grammar sử dụng phương pháp top-down"
date: 2023-09-13 00:16:00
summary: Context-free grammar và top-down parsing
mermaid: true
description: ghi chú về bài toán parsing context-free grammar sử dụng phương pháp top-down
categories: compiler
---

Tiếp theo bài viết trước về regular language, trong bài này ta tìm hiểu một số phương pháp parsing đối với ngữ pháp phi ngữ cảnh.

Nhắc lại một chút về ràng buộc đối với ngữ pháp phi ngữ cảnh, ta có ràng buộc sau:

- A -> β

Ràng buộc này có nghĩa ở vế trái chỉ có duy nhất 1 nonterminal symbol và vế phải có tuỳ ý một hoặc nhiều terminal/nonterminal symbol.
Ví dụ với ngôn ngữ L = { tập các cặp dấu (, ) lồng nhau } được một tả qua CFG như sau:

- S -> () \| (S)

Một ví dụ khác với L = { các biểu thức có các phép +, *, (, ) } được mô tả qua CFG như sau:

- E -> T \| E + T
- T -> int \| int * T \| (E)

Trở lại bài toán parsing, nhiệm vụ của ta sẽ nhận một chuỗi ký tự và kiểm tra xem chuỗi này có thuộc L hay không. Như ví dụ ở trên

- 1 + 1 ∈ L
- 100 * + 10 ∉ L

Tuy nhiên kiểm tra xem có thuộc L hay không chưa đủ, ta còn phải sinh ra cây cú pháp(abstract syntax tree).

## Abstract syntax tree(AST)

Ở các trình biên dịch, sau bước parsing, ta không chỉ biết được input có hợp ngữ pháp hay không, ta còn phải convert input(ở định dạng text) thành định dạng cây. Cây này sẽ làm input cho các bước sau(như phân tích ngữ nghĩa, transform, optimize,...).

Cây này được gọi là Abstract Syntax Tree(AST).

Trở lại ví dụ ngữ pháp cho biểu thức + và *, với input = 1000 + 100 * 10 ta sinh ra cây cú pháp như sau:

```mermaid
graph
  S1[E] --> S2[E]
  S1 --> S3[+]
  S1 --> S4[T]
  S4 --> S5[int]
  S5 --> S12[100]
  S4 --> S6[*]
  S4 --> S7[T]
  S7 --> S8[int]
  S8 --> S13[10]
  S2 --> S9[T]
  S9 --> S10[int]
  S10 --> S11[1000]
```

Cây AST có các thành phần sau:

- Root node: chính là Start symbol
- Leaf node: terminal symbol
- Inner node: nonterminal symbol

## Phương pháp parsing cho CFG

Đối với bài toán parsing cho ngữ pháp CFG, có 2 chiến lược:

- Top-down: bắt đầu từ Start symbol(root node trong AST), mở rộng AST bằng cách thay thế vế trái của CFG rule bằng vế phải của CFG rule. Kết thúc ở leaf node(terminal symbol). Thuật toán tiêu biểu cho top-down parsing gồm có recursive descent with backtrack, predictive parser.

- Bottom-up: bắt đầu từ terminal symbol(leaf node trong AST), rút gọn(reduce) symbol của vế phải bằng vế trái, kết thúc khi đến được root node. Thuật toán tiêu biểu cho bottom-up có LR(k), LALR, SLR.

## Recursive descent

Thuật toán chính để parse ngữ pháp CFG theo chiến lược top-down.

### Recursive descent with backtrack

Ví dụ:

CFG:
- Rule 1: E -> T
- Rule 2: E -> E + T
- Rule 3: T -> int
- Rule 4: T -> int * T 
- Rule 5: T -> (E)

Input: `(5)`

|Step|Input|Rule|Giải thích|
|--|--|--|--|
|1|(5)|E|Bắt đầu từ root node(start symbol) E|
|2|(5)|E -> T|Sử dụng rule 1|
|3|(5)|T -> int|Mở rộng T ở bước 2 dùng rule 3, int là terminal symbol, không match với `(` của input => backtrack|
|4|(5)|T -> int * T|Thử với rule 4, do vế phải đã là terminal symbol, so sánh symbol này với input hiện tại (dấu `(`) không match => backtrack|
|5|(5)|T -> (E)|Thử rule 5, match `(`(terminal symbol) với `(` của input, consume `(`|
|6|5)|E -> T|Tiếp tục mở rộng E theo rule 1|
|7|5)|T -> int|mở rộng T dùng rule 3, match terminal symbol int với 5|
|8|)||match với ) ở bước 5 => chấp nhận chuỗi (5)|

__Hạn chế của recursive descent__: recursive descent có một số hạn chế như

- Không thể parse CFG có prefix giống nhau ở vế phải. Quay lại ví dụ về CFG cho biểu thức +, * rule 3 và 4 có cùng prefix `int`, điều này sẽ gây ra
Ví dụ: input = `2 * 3`

Factor prefix:

- E -> T \| E + T
- T -> intQ \| (E)
- Q -> *T \| ε

- Left-recursive grammar: symbol ở vế trái là prefix ở vế phải(ví dụ: S -> Sa)
