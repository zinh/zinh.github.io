---
layout: post
title: "Using timestamp datatype in AWS's timestamp"
date: 2018-07-18 15:16:00
summary: Recently, I need to config an instance of AWS's Athena for a csv log format, turn out, they are some nitpick with the timestamp support on Athena
description: Recently, I need to config an instance of AWS's Athena for a csv log format
categories: ruby
---

So my setup was to collect log from services and push them periodically to S3 in CSV format, then use Athena to query and analyse these logs.
An important requirement is to be able to query by date range. That is how to make Athena aware of the date field from CSV.

From Athena's documentation, they should be able to support Date and Time types, as follow:

> DATE, in the UNIX format, such as YYYY-MM-DD
>
> TIMESTAMP. Instant in time and date in the UNiX format, such as yyyy-mm-dd hh:mm:ss[.f...]. For example, TIMESTAMP '2008-09-15 03:04:05.324'. This format uses the session time zone

So we just need to setup the CSV parser to be able to convert from string to time.
