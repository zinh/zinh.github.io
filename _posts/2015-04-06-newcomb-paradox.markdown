---
layout: post
title:  "Newcomb's paradox"
date:   2015-04-06 00:03:04
summary: Tưởng tượng một trò chơi bao gồm 2 nhân vật như sau Predictor có khả năng tiên đoán tương lai rất chính xác, Player một người chơi bình thường
description: Tưởng tượng một trò chơi bao gồm 2 nhân vật như sau Predictor có khả năng tiên đoán tương lai rất chính xác, Player một người chơi bình thường
categories: misc
---

Tưởng tượng một trò chơi bao gồm 2 nhân vật như sau:

1. __Predictor__: có khả năng tiên đoán tương lai rất chính xác.

2. __Player__: một người chơi bình thường.

Trò chơi sẽ được thực hiện bằng cách giới thiệu với *Player* 2 chiếc hộp, A và B. *Player* sẽ có 2 lựa chọn: chọn cả hộp A và B, hoặc chọn hộp B.

__Hộp A__ là một chiếc hộp trong suốt, bên trong chứa $1,000.

__Hộp B__ bị che lại, số tiền bên trong hộp B được quyết định như sau:

  - Trước khi *Player* đưa ra quyết định, *Predictor* sẽ tiên đoán xem *Player* sẽ chọn A và B hay chỉ chọn mỗi hộp B.
  - Nếu *Predictor* tiên đoán *Player* chọn cả A và B, hộp B sẽ không chứa gì hết($0).
  - Nếu *Predictor* tiên đoán *Player* chọn B, hộp B sẽ chứa $1,000,000.

Trước khi bắt đầu, *Player* được phổ biến tất cả các luật, cũng như số tiền bên trong hộp A, chỉ có lời tiên đoán của *Predictor* là không được biết trước.
Như vậy số tiền *Player* nhận được sẽ có các trường hợp sau:

| __Tiên đoán__ | __Hộp B chứa__ | __*Player* chọn__ | __Số tiền *Player* nhận được__ |
| A và B | $0| A và B| $1,000|
| A và B | $0 | B  | $0|
| B  | $1,000,000   | A và B  | $1,001,000|
| B | $1,000,000  | B  | $1,000,000|

Ta thử phân tích xem *Player* nên chọn hộp nào là tối ưu nhất.

__Cách thứ 1__: Giả thuyết *Predictor* tiên đoán *Player* sẽ chọn hộp A và B, khi đó *Player* phải chọn cả A và B để được số tiền $1,000, nếu chỉ chọn mỗi B số tiền *Player* nhận được là $0.

Giả thuyết tiếp là *Predictor* tiên đoán *Player* chọn hộp B, khi đó lựa chọn A và B vẫn là lựa chọn tối ưu để được số tiền lớn nhất($1,001,000).

Do đó, trong cả 2 trường hợp chọn cả A và B là lựa chọn tối ưu nhất.

Tuy nhiên, vẫn còn một cách suy luận khác

__Cách thứ 2__: do điền kiện ban đầu cho thấy *Predictor* tiên đoán tương lại rất chính xác, nên ta phải bỏ qua trường hợp *Player* chọn ngược lại với lời tiên đoán, payoff matrix của ta khi đó chỉ còn 2 lựa chọn:

| __Tiên đoán__ | __*Player* chọn__ | __Số tiền *Player* nhận được__ |
| A và B | A và B | 1,000|
| B | B |1,000,000|

Như thế rõ ràng *Player* phải chọn hộp B để được số tiền cao nhất.

Cả 2 cách suy luận đều có vẻ hợp lí, nhưng lại dẫn đến 2 kết quả trái ngược nhau.

Did something go wrong?
