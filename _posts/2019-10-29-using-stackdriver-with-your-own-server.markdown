---
layout: post
title: "Sending log to GCP's Stackdriver from any server"
date: 2019-10-28 15:16:00
summary: How to configure fluentd to send log to GCP stackdriver from any server, not necessarily from GCP or AWS.
description: How to configure fluentd to send log to GCP stackdriver from any server, not necessarily from GCP or AWS.
categories: infrastructure
---

GCP documentation is not the best one, in my opinion. There are various features that are buried deep inside plethora of api documentations.
Stackdriver's Logging is one of them. Google provides their own altered version of Fluentd in order to send log to Stackdriver. They also require us to run this agent on a GCP or AWS's services. No other cloud provider is supported. So, in this post I will try to config my fluentd to send log from my own on-prem server to Stackdriver.

# The setup

Our Gemfile looks like this

~~~ ruby
gem "fluentd", '1.6.3'
gem 'fluent-plugin-google-cloud', '0.7.22'
~~~

We need to pay attention to the version because `fluent-plugin-google-cloud` usually requires an older version fluentd.

After that, we `bundle install`

~~~ bash
bundle install --path bundle/vendor
~~~

# The fluentd config

Basic setup to test our fluentd(send `debug` tagged event to stdout)

~~~
# fluentd.conf
<source>
  @type forward
  @id forward_input
</source>

<match debug.**>
  @type stdout
  @id stdout_output
</match>
~~~

Run and test:

~~~ bash
bundle exec fluentd -c ./fluentd.conf

# let's send a sample log event using fluent-cat
echo '{"message": "test"}' | be fluent-cat -t debug
~~~

# Send log to Stackdriver

### Official config

The documentation of `fluent-plugin-google-cloud` instructs us to add a `add_insert_ids` filter, so we will update our `fluentd.conf` such as

~~~
<filter stackdriver.**>
  @type add_insert_ids
</filter>

# send all stackdriver.* tagged event to Stackdriver
<match stackdriver.**>
  @type google_cloud
</match>
~~~

With this config we are good to go if our fluentd runs on an GCP or AWS's services. If it doesn't, exception will be raised and we will need ajust `fluentd.conf` a little bit more.

### Send log from any cloud provider services

The reason that the official config doesn't work on other cloud provider is that `fluent-plugin-google-cloud` need to pull some meta-data from meta-server. This server is defined as a constant `METADATA_SERVICE_ADDR = '169.254.169.254'.freeze` [ref](https://github.com/GoogleCloudPlatform/fluent-plugin-google-cloud/blob/a7838d2cd05284145da9063739a45cf27b616cf7/lib/fluent/plugin/out_google_cloud.rb#L279)

On our own server, without this meta-service, we will need to provide neccessary meta data. The requires parameters are defined as:

[ref](https://github.com/GoogleCloudPlatform/fluent-plugin-google-cloud/blob/a7838d2cd05284145da9063739a45cf27b616cf7/lib/fluent/plugin/out_google_cloud.rb#L1131-L1147)

~~~ ruby
def set_required_metadata_variables
  set_project_id
  set_vm_id
  set_vm_name
  set_location
  ...
end
~~~

So, out `fluentd.conf` will become:

~~~
<match stackdriver.**>
  @type google_cloud
  use_metadata_service false # this will disable requesting to meta-server
  project_id our-project-id
  zone our-az
  vm_id our-vm-id
  vm_name our-server-hostname
</match>
~~~

Restart fluentd and send a sample event

~~~ bash
echo '{"message": "test"}' | bundle exec fluent-cat -t stackdriver.test
~~~

On Stackdriver's Logs Viewer, the event will be listed inside __GCE VM Instance__ category with `instance_id` is `vm_id` that we configured.

The above setting is just minimum required parameters, there are lots more useful one that we can find in `fluent-plugin-google-cloud`'s [source](https://github.com/GoogleCloudPlatform/fluent-plugin-google-cloud/blob/a7838d2cd05284145da9063739a45cf27b616cf7/lib/fluent/plugin/out_google_cloud.rb#L296) or from Google's  [official documentation](https://cloud.google.com/logging/docs/agent/configuration#cloud-fluentd-config)(though not all of available parameters so we will need to consult source code anyway)
