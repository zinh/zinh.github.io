---
layout: post
title: "Linux ODBC and Microsoft Access"
date: 2023-06-07 00:16:00
summary: How to load data from Microsoft Access in your Linux box
description: How to load data from Microsoft Access in your Linux box
categories: misc
---

The other day I needed to do some data analysis from a Microsoft Access file on my FreeBSD box. Here are the steps that I took.

__Goal__: load data from Access into Python to perform data analysis

__Library/program used__:

- Python with [PyODBC](https://pypi.org/project/pyodbc/)
- [UnixODBC](https://www.unixodbc.org)
- [MDBTools](https://github.com/mdbtools/mdbtools)

### UnixODBC

UnixODBC is ODBC an implementation on Linux/Unix. Installing it is quite easy, we can simply download the source code, run `./configure`, `make` and `make install`.

### MDBTools

To actually connect to a database using ODBC, we'll also need a driver for that database. The ODBC driver for Access provided by Microsoft doesn't have a Linux installation, so we'll need to find a third-party driver.

There are paid libraries, such as the one from Easysoft (closed source but may have better quality). Luckily, I found one open-source driver from MDBTools. MDBTools is a collection of CLI tools to interact with an Access database, and it also contains an ODBC driver. We'll install this driver.

The source code is at [https://github.com/mdbtools/mdbtools](https://github.com/mdbtools/mdbtools)

Installation of MDBTools is quite easy, we just need to add the flag `--with-unixodbc` and set the path to our unixODBC installation. If we installed unixODBC in a non-standard path(e.g.,`$HOME`), we also need to set `CPPFLAGS` and `LDFLAGS` so that MDBTools knows where to find the library and header files.

### Config unixODBC

Now we'll need to config unixODBC so that it knows about our Access Driver, there are two files that we need:

- odbcinst.ini (in etc folder): contains the configuration of ODBC drivers
- odbc.ini (in etc folder): contains the configuration of Database

We'll add Access driver to `odbcinst.ini` as follows:

```
[MDBTools]
Driver = <path to mdbtools installation>/lib/odbc/libmdbodbc.so
```

`odbc.ini` is where we configure our database. For example, if I have an Access file named `test.accdb`, I will configure it as follows:

```
[test]
Driver = MDBTools
Database = <path to our database file>/test.accdb
```

After this, we can use unixODBC to connect to access, for example using its `isql` command:

```
isql test
> select * from test_table
```

### Connect from Python

I also wanted to load Access data into Python so I used pyodbc to do that. It's a wrapper for unixODBC so we'll need unixODBC installed before we can actually run `pyodbc`.

To check if `pyodbc` can actually load unixODBC, we need to import it:

```python
# pip install pyodbc
import pyodbc
```

If there is an error such as `ImportError: Shared object "libodbc.so.2" not found, required by "pyodbc.cpython-310.so"`, we need to check our unixODBC installation. If we installed it in a non-standard folder, we can set the LD_LIBRARY_PATH environment variable to our unixODBC's `lib` folder.

After properly import `pyodbc`, we can read our Access database as follows:

```python
import pyodbc
file_name = "<path to access file>"
con = pyodbc.connect(f'DRIVER=MDBTools;DBQ={file_name}')
cursor = con.cursor()
cursor.execute('SELECT * FROM test_table').fetchone()

# we can even load our Access data into a Pandas dataframe
import pandas as pd
df = pd.read_sql('SELECT * FROM test_table', con)
```

### Conclusion

Although I can connect and load data from Access, sometimes I get some weird errors from pyodbc (or MDBTools). My suggestion is to save the Access data to other natively supported database systems on Linux, such as SQLite, as soon as we can load it. It's easy to do that from pandas.

```python
import pyodbc
import sqlite3
import pandas as pd

access_con = pyodbc.connect('DRIVER=MDBTools;DBQ=test.accdb')
sqlite_con = sqlite3.connect('test.sqlite3')

df = access_con.read_sql('SELECT * FROM test_table', access_con)
df.to_sql('test_table', sqlite_con)
```
