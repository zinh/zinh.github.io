---
layout: post
title: "Centos 7 install with virt-install"
date: 2019-11-15 00:00:01
summary: How to install CentOS 7 guest using virt-install in text mode
description: How to install CentOS 7 guest using virt-install in text mode
categories: infrastructure
---

It took me quite sometime to figure out how to install Centos 7 in text-mode with `virt-install`. 
Somehow, Centos 6 can be install normally using standard method but it always crashes during text-installation of Centos 7. In this quick note, let try to solve it.

So, my Virsh version is 0.10.2(virt-install is at 0.600.0) running inside an old Centos 6 host.

Normally, to install a Centos guest, we need to execute command such as:

~~~bash
virt-install --name=centos7 
  --ram=1024 
  --vcpus=1 
  --os-type=linux
  --disk path=/var/lib/libvirt/images/centos7,size=15 
  --network=bridge:br0 
  --location http://ftp.tsukuba.wide.ad.jp/Linux/centos/7/os/x86_64/ 
  --console pty,target_type=serial 
  --extra-args 'console=ttyS0,115200n8 serial'
~~~

this work until Centos 7, which somehow still run the graphical installation and mess up the console. In order to install Centos 7, I've done the following steps.

__First__, download an ISO, I've used minimal install from one of many Centos's mirrors:

```
http://isoredirect.centos.org/centos/7/isos/x86_64/
```

__Second__, download a seperated `initrd` and `vmlinuz` images(or we can extract it from the iso)

```
http://ftp.jaist.ac.jp/pub/Linux/CentOS/7.7.1908/os/x86_64/images/pxeboot/
```

__Third__, run the `virt-install` command

~~~bash
virt-install --name=centos7 
  --ram=1024 
  --vcpus 1 
  --network bridge=br0 
  --disk path=/var/lib/libvirt/images/centos7,size=10 
  --disk /var/lib/libvirt/isos/CentOS-7-x86_64-Minimal-1908.iso,device=cdrom 
  --console pty,target_type=serial 
  --boot kernel=/var/lib/libvirt/isos/vmlinuz,initrd=/var/lib/libvirt/isos/initrd.img,kernel_args="earlyprintk=serial console=ttyS0"
~~~

This time, Centos 7 is really run in text intall mode.

__Lastly__, after finishing the installation, we can shutdown this guest, running it again without the boot command(this time we will boot directly from disk and no need for the cdrom parameter), so the command looks like:

~~~bash
virt-install --name=centos7 
  --ram=1024 
  --vcpus 1 
  --network bridge=br0 
  --disk path=/var/lib/libvirt/images/centos7,size=10 
  --console pty,target_type=serial 
  --boot hd
~~~
