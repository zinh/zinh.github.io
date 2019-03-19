---
layout: post
title: "Simple HTTPS setup with Let's encrypt and acme.sh"
date: 2019-03-18 15:16:00
summary: How to setup https with Let's encrypt and acme.sh
description: How to setup https with Let's encrypt and acme.sh for nginx or haproxy
categories: infrastructure
---

With various browsers's enforcement of https I think https is a must when deploying a new website.
Luckily, we have Let's Encrypt which provide free https certificate and allow us to request certificates through their API.
However, work still need to be done in order to integrate Let's encrypt with our own infrastructure i.e we need to have a process to issue and renew certificate automatically which sometimes a litte bit tricky.
But that's the story before acme.sh with this new tool, working with Let's encrypt has never been easier, let's work through the steps to set it up.

So what does [acme.sh](https://acme.sh/) differ with Let's encrypt offical client(certbot)?

It's written in bash script so it works on almost every Linux distribution with no other dependency, just clone the code and we're good to go.
acme.sh also provides various plugins to help us integrate with various cloud services such as Route53, Google Domain
(refer their [documentation](https://github.com/Neilpang/acme.sh#8-automatic-dns-api-integration) for a full list of supported DNS provider).
