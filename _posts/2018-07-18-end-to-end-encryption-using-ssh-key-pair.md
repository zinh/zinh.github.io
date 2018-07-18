---
layout: post
title: "End to end encrypt using ssh key pairs"
date: 2018-07-18 15:16:00
summary: How to encrypt/decrypt using your ssh keypair with openssl
description: The other day, I need to passwords to a colleague, using openssl we can a simple end-to-end encryption
categories: ruby
---

TLDR

Encrypt onliner using ssh public key

```
echo <text> > plaintext; curl -s https://github.com/zinh.keys | ssh-keygen -f /dev/stdin  -e -m PKCS8 | openssl rsautl -inkey /dev/stdin -encrypt -pubin -in plaintext -ssl | base64 ; rm -f plaintext
```

Decrypt onliner using ssh private key

```
echo "<encrypted text" | base64 -D | openssl rsautl -decrypt -inkey ~/.ssh/id_rsa
```
