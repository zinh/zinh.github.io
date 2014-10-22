---
layout: post
title:  "Implement logistic regression using Fisher Scoring method"
date:   2014-10-16 23:55:00
summary: Use logistic regression to solve binary classification problem. For simplicity, I have use Newton method(also called Fisher scoring) to get the optimize parameters.
categories: ruby
---

We have log likelihood of logistic regression is:

$$
l(\theta) = \sum\limits_{i=1}^{m} y^{(i)}ln h(x^{(i)}) + (1 - y^{(i)})ln(1 - h(x^{(i)})
$$

In order to maximize \\(l(\theta)\\), using Newton method to find \\(\theta\\). We have:

$$
\theta := \theta - H^{-1} \nabla_{\theta} l(\theta)
$$

Where H is Hessian matrix:

$$
H_{i,j} = \frac{\partial^2l(\theta)}{\partial \theta_i \partial \theta_j} 
$$

and \\( \nabla_{\theta}l(\theta)\\) is the vector of partial derivatives of \\(l(\theta)\\)
with respect to the \\(\theta\\)

For simplicity, I have used Matlab to calculate the above equation

{% highlight matlab %}
function theta = newton(X, y, theta)
  [m, n] = size(X);
  dl = (y - sigmoid(X * theta))' * X;
  S = diag((sigmoid(X * theta) - 1) .* sigmoid(X * theta));
  h = X' * S * X;
  theta = theta - inv(h) * dl';
end
{% endhighlight %}
