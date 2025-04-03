---
layout: post
title: "How default PATH is set when ssh to a remote server"
date: 2020-01-20 15:16:00
summary: In this post, I will introduce about Ruby's fiber and some of its application in concurrency processing.
description: In this post, I will introduce about Ruby's fiber and some of its application in concurrency processing.
categories: infrastructure
---

# Observation

I just had an usecase with ansible's command module PATH variable. Let's have a simple example:

~~~bash
ansible -i inventory/local -m command -a 'echo $PATH' test01
=> /usr/local/bin:/usr/bin

ansible -i inventory/local -b -m command -a 'echo $PATH' test01
=> /sbin:/bin:/usr/sbin:/usr/bin
~~~

Parameter explanation:

- `-i`: inventory file
- `-m`: module name
- `-a`: module's additional parameter
- `-b`: run under `root` user
- `test01` is my test server

As we can see, there is a different between the PATH when running under normal user and `root`.
My question is how and where it is defined.

~~~
ssh centos@192.168.60.17 'echo $PATH'
=> /usr/local/bin:/usr/bin

ssh root@192.168.60.17 'echo $PATH'
=> /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
~~~

openssh-server



Let's see how normal user have the PATH of `/usr/local/bin:/usr/bin`

Although not quite familiar with ansible's codebase but doesn't hurt if I take a look.

The command module is defined in `command.py`

[command.py](https://github.com/ansible/ansible/blob/4752547d35db67db38ac03bd0558c89d09b9487f/lib/ansible/modules/commands/command.py#L222)

my focus is this line:

``` python
# https://github.com/ansible/ansible/blob/4752547d35db67db38ac03bd0558c89d09b9487f/lib/ansible/modules/commands/command.py#L315
rc, out, err = module.run_command(args, 
  executable=executable, 
  use_unsafe_shell=shell, 
  encoding=None, 
  data=stdin, 
  binary_data=(not stdin_add_newline))
```

So they call `run_command` from module(which is a AnsibleModule, ie: ansible.module_utils.basic)

`run_command` in turn, is defined at: [basic.py](https://github.com/ansible/ansible/blob/4752547d35db67db38ac03bd0558c89d09b9487f/lib/ansible/module_utils/basic.py#L2389)

we soon arrive at:

``` python
cmd = subprocess.Popen(args, **kwargs)
```

Let's check Python documentation of subprocess.

[popen-constructor](https://docs.python.org/2/library/subprocess.html#popen-constructor)

> If env is not None, it must be a mapping that defines the environment variables for the new process; these are used instead of inheriting the current process’ environment, which is the default behavior.

We know that ansible is run through ssh connection; therefore, our calling order would be:

```
[workstation] ansible -i inventory/local -m command -a 'echo $PATH' test01
              ↓
[remote]      sshd
              ↓
[remote]      python command.py
              ↓
[remote]      echo $PATH
```

If during the execution of python, we doesn't overwrite `PATH` it will be inherited from its parent process, ie: `sshd`; therefore, it must be defined by sshd.

Let's check sshd source

[session.c](https://github.com/openssh/openssh-portable/blob/101ebc3a8cfa78d2e615afffbef9861bbbabf1ff/session.c#L1516)

``` c
execve(shell, argv, env);
```

more detail of `execve` syscall is at man7.

```c
if (path == NULL || *path == '\0') {
        child_set_env(&env, &envsize, "PATH",
            s->pw->pw_uid == 0 ?  SUPERUSER_PATH : _PATH_STDPATH);
}
```

So if we are running as root(uid = 0), PATH will be set to `SUPERUSER_PATH`, otherwise, `_PATH_STDPATH`.
Now we are almost there, where is `_PATH_STDPATH` and `SUPERUSER_PATH` defined?

[defines.h#L42](https://github.com/openssh/openssh-portable/blob/101ebc3a8cfa78d2e615afffbef9861bbbabf1ff/defines.h#L42)

```cpp
#ifdef USER_PATH
# ifdef _PATH_STDPATH
#  undef _PATH_STDPATH
# endif
# define _PATH_STDPATH USER_PATH
#endif

#ifndef _PATH_STDPATH
# define _PATH_STDPATH "/usr/bin:/bin:/usr/sbin:/sbin"
#endif

#ifndef SUPERUSER_PATH
# define SUPERUSER_PATH _PATH_STDPATH
#endif
```
