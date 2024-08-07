---
layout: post
title: "Getting Django to Work on a Cheap Shared Hosting Plan"
date: 2024-07-09 00:16:00
summary: This blog post explains how to set up a Django application on a shared server using SSH access, pyenv, and Apache with a .htaccess file for URL rewriting.
description: This blog post explains how to set up a Django application on a shared server using SSH access, pyenv, and Apache with a .htaccess file for URL rewriting
categories: infrastructure
---

I am renting a very cheap shared server with very generous specs (300 GB disk, TBs of bandwidth, etc.) for about $3/month. Though there are some limitations such as running on fairly old technology, basically a CPanel shared host, only supporting web server with Apache with PHP through CGI, no root access. However, they provide SSH access, so I can manage to run a modern framework with it.

Let's first install python. I use pyenv to `manage` python versions:

```
pyenv install 3.10.2
```

The Apache webserver serves files under `~/www`, so I will create a subfolder there and then make a virtual environment for Python:

```
mkdir ~/www/django && cd ~/www/django
python -mvenv py
./py/bin/pip install django
```

Now, let's create a very simple Django application. I'll call it index.cgi(also need to chmod u+x):

```python
#!/home/myname/www/django/py/bin/python
#~/www/django/index.cgi
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

# path: / 
def index(request):
    return HttpResponse("index")

# path: /blog
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

With this file, the server can serve Django content so that when I access `/django/index.cgi`, it will return the index content, and `/django/index.cgi/blog` will return the blog content.

I will add a .htaccess file to rewrite URLs to a shorter form:

```htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.cgi/$1 [QSA,L]
```

With this .htaccess configuration, accessing `/django` will point to the index, and `/django/blog` will point to the blog.
