---
layout: post
title: "Run Django in my managed server"
date: 2024-07-09 00:16:00
summary: I am renting a dirt cheap managed server, in this post I will explain how to run django with it
description: Summarize of module and how to use it in JavaScript
categories: infrastructure
---

I am renting a very cheap managed server with very generous specs (300 GB disk, TBs of bandwidth, etc.) for about $3/month. Though there are some limitations such as running on fairly old technology, only supporting a web server with Apache and PHP through CGI/FastCGI, and there is no root access. However, they provide SSH access, so I can manage to run a modern framework with it.

Let's first install python. I use pyenv to `manage` python versions:

```
pyenv install 3.10.2
```

The Apache webserver serves files under ~/www, so I will create a subfolder there and then make a virtual environment for Python:

```
mkdir ~/www/django && cd ~/www/django
python -mvenv py
./py/bin/pip install django
```

Now, let's create a very simple Django application. I'll call it index.cgi:

```python
#!/home/myname/www/django/py/bin/python
# index.cgi
from wsgiref.handlers import CGIHandler
from django.conf import settings
from django.http import HttpResponse
from django.urls import path
from django.core.wsgi import get_wsgi_application

settings.configure(
        ROOT_URLCONF=__name__,
        DEBUG=True,
        SECRET_KEY="my-secret-key"
)
def index(request):
    return HttpResponse("index")

def blog(request):
    return HttpResponse("blog")

urlpatterns = [
    path("", index),
    path("blog", blog)
]

if __name__ == "__main__":
    application = get_wsgi_application()
    CGIHandler().run(application)
```

With this file, the server can serve Django content so that when I access /django/index.cgi, it will return the index content, and /django/index.cgi/blog will return the blog content.

I will add a .htaccess file to rewrite URLs to a shorter form:

```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.cgi/$1 [QSA,L]
```

With this .htaccess configuration, accessing /django will point to the index, and /django/blog will point to the blog.
