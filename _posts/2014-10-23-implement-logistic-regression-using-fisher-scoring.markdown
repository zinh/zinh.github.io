---
layout: post
title:  "Implement logistic regression using Fisher's scoring method"
date:   2014-10-22 23:55:00
summary: Use logistic regression to solve binary classification problem. For simplicity, I have use Newton method(also called Fisher's scoring) to get the optimize parameters.
mathjax: true
categories: ruby
---

For a training set X of \\(m\\) samples, each sample have \\(n\\) features.
\\(y\\) is the responder. Both X and y can be written in matrix form as:

$$
X = \begin{bmatrix}
x^{1}_{1}&x^{1}_{2}&x^{1}_{3}&\cdots&x^{1}_{n}\\
x^{2}_{1}&x^{2}_{2}&x^{2}_{3}&\cdots&x^{2}_{n}\\
\vdots&\vdots&\vdots&\ddots&\vdots\\
x^{m}_{1}&x^{m}_{2}&x^{m}_{3}&\cdots&x^{m}_{n}\\
\end{bmatrix}
=
\begin{bmatrix}
x^{(1)^T}\\
x^{(2)^T}\\
x^{(3)^T}\\
\vdots\\
x^{(m)^T}
\end{bmatrix}
\ where\ x^i_j \in \mathbf{R}
\\
y = \begin{bmatrix}
y_1\\
y_2\\
\vdots\\
y_m
\end{bmatrix}
\ where\ y_i \in \left\{ {0, 1}\right\}
$$

We have log [likelihood](http://en.wikipedia.org/wiki/Likelihood_function){:target="_blank"}{:rel="nofollow"} of [logistic regression](http://en.wikipedia.org/wiki/Logistic_regression){:target="_blank"}{:rel="nofollow"}:

$$
l(\theta) = \sum\limits_{i=1}^{m}[y^{(i)}ln\ h(x^{(i)}) + (1 - y^{(i)})ln(1 - h(x^{(i)})]
$$

Where \\(h(x^{(i)})\\) is sigmoid function of \\(x^{(i)}\\)

$$
h(x^{(i)}) = \frac{1}{1 + e^{-\theta^Tx^{(i)}}}
$$

In order to maximize \\(l(\theta)\\), I use [Newton method](http://en.wikipedia.org/wiki/Newton's_method){:target="_blank"}{:rel="nofollow"} to find \\(\theta\\). We have:

$$
\theta := \theta - H^{-1} \nabla_{\theta} l(\theta)
$$

Where H is [Hessian matrix](http://en.wikipedia.org/wiki/Hessian_matrix){:target="_blank"}{:rel="nofollow"}:

$$
H_{i,j} = \frac{\partial^2l(\theta)}{\partial \theta_i \partial \theta_j} 
$$

and \\( \nabla_{\theta}l(\theta)\\) is the [vector of partial derivatives](http://en.wikipedia.org/wiki/Del){:target="_blank"}{:rel="nofollow"} of \\(l(\theta)\\)
with respect to the \\(\theta\\)

$$
\nabla_{\theta}l(\theta) = 
\begin{bmatrix}
\frac{\partial l(\theta)}{\partial \theta_1}\\
\frac{\partial l(\theta)}{\partial \theta_2}\\
\cdots\\
\frac{\partial l(\theta)}{\partial \theta_m}\\
\end{bmatrix}
$$

The matrix form of \\(H_{i,j}\\) is:

$$
H = X'SX
$$

here `S` is the matrix of:

$$
S = \begin{bmatrix}
h(x^{(1)})(1 - h(x^{(1)})&0&\cdots&0 \\
0&h(x^{(2)})(1 - h(x^{(2)})&\cdots&0 \\
\vdots&\vdots&\ddots&\vdots \\
0&0&\cdots&h(x^{(m)})(1 - h(x^{(m)}))
\end{bmatrix}
$$

Having all the thing I need, let implement it! For simplicity, I have used Matlab to calculate the above equation

{% highlight matlab %}
function theta = newton(X, y, theta)
  dl = (y - sigmoid(X * theta))' * X;
  S = diag((sigmoid(X * theta) - 1) .* sigmoid(X * theta));
  h = X' * S * X;
  theta = theta - inv(h) * dl';
end
{% endhighlight %}

P/S: using MathJax for Latex is so convenience!
