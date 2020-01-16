---
layout: post
title: "Using CentOS's cloud image to bootstrap a CentOS virtual machine"
date: 2019-11-29 00:00:01
summary: CentOS provides preconfigured cloud images which let's conveniently import and using without having to install from scratch. We will do some customise with this image in this post.
description: CentOS provides preconfigured cloud images which let's conveniently import and using without having to install from scratch. We will do some customise with this image in this post.
categories: infrastructure
---

CentOS provides preconfigured cloud image letting us conveniently import and using without having to install from scratch. However, in order to use it locally, we will need to do some customise with this image.

These images can be download from the following url:

[https://cloud.centos.org/centos/7/images/](https://cloud.centos.org/centos/7/images/)

I will just using the latest of Centos 7 [CentOS-7-x86_64-GenericCloud.qcow2](https://cloud.centos.org/centos/7/images/CentOS-7-x86_64-GenericCloud.qcow2)

To import this image, I use `virt-install` with these options:

```
virt-install --name centos7 \
  --ram=512 \
  --disk path=CentOS-7-x86_64-GenericCloud.qcow2.qcow2,format=qcow2 \
  --console pty,target_type=serial \
  --import
```

Unfortunatelly, the default setting of this image uses `cloud-init` to perform initial setup(such as set ssh key for user) which in turn requests meta data from the address `http://168.254.169.254`.

Of course, on our local system, this address is not accessible so normally after booting we will be arrivied with the login screen but unable to login.

That is where we need to change the root's password.

Anyway, when we first booting Centos, at the Grub's OS selection screen, something looks like this one:

![image](https://user-images.githubusercontent.com/5134525/69855259-798bf600-12ce-11ea-8f3b-aecfcb08df0e.png)

we press `e` in order to change the boot parameters and change the line begins with `linux16 /boot/...` to add these new parameters at the end:

```
rd.break enforcing=0
```

so the results will looks like this

```
linux16 /boot/... rd.break enforcing=0
```

after that, Ctrl-X to continue with the booting, we will arrive at the emergency mode, looks like:

![image](https://user-images.githubusercontent.com/5134525/69855556-164e9380-12cf-11ea-9746-cf51f1edf80b.png)

execute the following commands:

```
# mount sysroot as writeable
switch_root:/# mount -o remount,rw /sysroot

# chroot into sysroot
switch_root:/# chroot /sysroot

# change root's password
sh-4.2# passwd

# correct SELinux label of /etc/shadow
sh-4.2# /sbin/restorecon /etc/shadow
```

Optionally, we can disable `cloud-init` for faster booting:

```
sh-4.2# touch /etc/cloud/cloud-init.disabled
```

Lastly, we `exit` x 2 and resume the booting process, this time we would be able to log in with user root.

We can copy this image and use it as base image for later use without needing to reset root password again.
