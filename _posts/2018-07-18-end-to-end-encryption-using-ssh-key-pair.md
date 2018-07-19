---
layout: post
title: "End to end encrypt using ssh key pairs"
date: 2018-07-18 15:16:00
summary: When you're too lazy to install gpg, this oneliner can be used to encrypt/decrypt a message with ssh keypair
description: When you're too lazy to install gpg or keybase, this oneliner can be used to encrypt/decrypt a message with ssh keypair
categories: ruby
---

## TLDR

To send a message to someone using his github's public key

~~~ bash
TO=<GITHUB USER NAME> TEXT='<SUPER SECRET TEXT>'; 
curl -s https://github.com/$TO.keys | ssh-keygen -f /dev/stdin  -e -m PKCS8 > $TO.pem.pub; 
echo $TEXT | openssl rsautl -inkey $TO.pem.pub -encrypt -pubin -ssl | base64 ; 
rm -f $TO.pem.pub
~~~ 

Receiver will use his SSH private key to decrypt

~~~ bash
echo "<encrypted text>" | base64 -D | openssl rsautl -decrypt -inkey ~/.ssh/id_rsa
~~~ 

## Explanation

The encryption script will download the public key of a github user, convert to PKCS8 format, then use `openssl rsautl` to encrypt the text, finally output base64 encoding of the encrypted text.

Receiver will need his private key to recover the original text(also using `openssl rsautl` utility).

Refer to openssl rsautl [man page](https://www.openssl.org/docs/man1.1.0/apps/openssl-rsautl.html){:target="_blank"}{:rel="nofollow"} for a more detail of the parameters.

__Limitation__
- Should use to encrypt short message only as RSA is quite slow. In case we need to encrypt long text or file, we should create a symmetric key and use it to encrypt the text then use RSA to encrypt that key.
- As `https://github.com/$USER.keys` will return all public keys of a user, the script will use the last key in this list.
