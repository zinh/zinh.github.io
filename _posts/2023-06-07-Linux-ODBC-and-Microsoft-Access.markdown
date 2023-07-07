---
layout: post
title: "Linux ODBC and Microsoft Access"
date: 2023-06-07 00:16:00
summary: How to load data from Microsoft Access in your Linux box
description: How to load data from Microsoft Access in your Linux box
categories: misc
---

The other day I need to do some data analysis from a Microsoft Access file in my FreeBSD box, here are the steps that I've done

__Goal__: load data from Access into Python to perform data analysis

__Library/program used__:

- Python with [PyODBC](https://pypi.org/project/pyodbc/)
- [UnixODBC](https://www.unixodbc.org)
- [MDBTools](https://github.com/mdbtools/mdbtools)

### UnixODBC

UnixODBC is ODBC implementation on Linux/Unix. Installing it is quite easy, we can simply download the source code, `./configure`, `make` and `make install`.

### MDBTools

To actually connect to a database using ODBC, we'll also need a driver for that database. The ODBC for Access provided by Microsoft doesn't have a Linux installation so we'll need to find 3rd party driver.

There are paid libraries such as the one from Easysoft(closed source but may have better quality). Luckily, I found one open-source driver from MDBTools. MDBTools is a collection of cli tools to interact with a Access database, it also contains a ODBC driver. We'll install this driver.

The source code is at [https://github.com/mdbtools/mdbtools](https://github.com/mdbtools/mdbtools)

Installation of MDBTools is quite easy, we just need to add the flag `--with-unixodbc` and set the path to our unixODBC. If we installed unixODBC in a non-standard path(`$HOME` for example), we also need to set `CPPFLAGS` and `LDFLAGS` so that MDBTools knows where to find the library and header files.

### Config unixODBC

Now we'll need to config unixODBC so that it knows about our Access Driver, there are two files that we need:

- odbcinst.ini (in etc folder): contains config of ODBC drivers
- odbc.ini (in etc folder): contains config of Database

We'll add Access driver to `odbcinst.ini` as follow:

```
[MDBTools]
Driver = <path to mdbtools installation>/lib/odbc/libmdbodbc.so
```

`odbc.ini` is where we config our database so for example I have an access file name test.accdb, I will config it as follow

```
[test]
Driver = MDBTools
Database = <path to our database file>/test.accdb
```

After this, we can use unixODBC to connect to access, for example using its isql command:

```
isql test
> select * from test_table
```

### Connect from Python

I also want to load Access data into Python so I used pyodbc to do that. It's a wrapper to unixODBC so we'll need unixODBC installed before we can actually run pyodbc.

To check if pyodbc can actually load unixODBC, we need to import it

```python
# pip install pyodbc
import pyodbc
```

If there is error such as `ImportError: Shared object "libodbc.so.2" not found, required by "pyodbc.cpython-310.so"`, we need to check our unixODBC installation. If we installed it in a non-standard folder, we can set the LD_LIBRARY_PATH environment variable to our unixODBC's lib folder.

After properly import pyodbc, we can read our Access database as follow:

```python
import pyodbc
file_name = "<path to access file>"
con = pyodbc.connect(f'DRIVER=MDBTools;DBQ={file_name}')
cursor = con.cursor()
cursor.execute('SELECT * FROM test_table').fetchone()

# we can even load our Access data into Pandas dataframe
import pandas as pd
df = pd.read_sql('SELECT * FROM test_table', con)
```

### Conclusion

Although I can connect and load data from Access, sometimes I get some weird errors from pyodbc(or MDBTools). My suggestion is as soon as we can load Access data, save it to other natively supported database systems on Linux such as sqlite. It's easy to do that from pandas

```
import pyodbc
import sqlite3
import pandas as pd

access_con = pyodbc.connect('DRIVER=MDBTools;DBQ=test.accdb')
sqlite_con = sqlite3.connect('test.sqlite3')

df = access_con.read_sql('SELECT * FROM test_table', access_con)
df.to_sql('test_table', sqlite_con)
```
