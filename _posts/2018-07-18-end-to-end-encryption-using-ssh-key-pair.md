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

### Encryption steps

~~~ bash
curl -s https://github.com/$TO.keys
~~~ 

First, we will download the public keys of a github user. For example, my public key will be at [https://github.com/zinh.keys](https://github.com/zinh.keys){:target="_blank"}{:rel="nofollow"}

~~~ bash
ssh-keygen -f /dev/stdin  -e -m PKCS8 > $TO.pem.pub
~~~ 

then convert this key to PKCS8 format(.pem) and save it to a temporary file.

~~~ bash
echo $TEXT | openssl rsautl -inkey $TO.pem.pub -encrypt -pubin -ssl
~~~ 

after that, use `rsautl` of openssl to encrypt a text from stdin, using RSA algorithm with ssl padding.

As the output is in binary format, we will need to encode in base64 for easier sending by pipe the encrypted text to base64 program.

Finally, remove the download key.

### Dencryption steps

Decryption is quite forward, a user will use his ssh key to decrypt the text(after using base64 to decode)

The encryption script will download the public key of a github user, convert to PKCS8 format, then use `openssl rsautl` to encrypt the text, finally output base64 encoding of the encrypted text.

Refer to openssl rsautl [man page](https://www.openssl.org/docs/man1.1.0/apps/openssl-rsautl.html){:target="_blank"}{:rel="nofollow"} for a more detail of the parameters.

__Limitation__
- Should use to encrypt short message only as RSA is quite slow. In case we need to encrypt long text or file, we should create a symmetric key and use it to encrypt the text then use RSA to encrypt that key.
- As `https://github.com/$USER.keys` will return all public keys of a user, the script will use the last key in this list.
