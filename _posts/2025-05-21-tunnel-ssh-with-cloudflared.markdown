---
layout: post
title: "Tunnel SSH connection using cloudflared"
date: 2025-05-21 00:16:00
summary: This blog post explains how to set up an SSH tunnel to a private server using Cloudflare cloudflared tool. It walks through downloading the binary, configuring a tunnel and DNS routing, and connecting securely from another machine without needing root access or additional network configuration tools.
description: This blog post explains how to set up an SSH tunnel to a private server using Cloudflare cloudflared tool. It walks through downloading the binary, configuring a tunnel and DNS routing, and connecting securely from another machine without needing root access or additional network configuration tools.
categories: infrastructure
---

I've been searching for a simple way to tunnel an SSH connection to my private server. There are many solutions to this problem, such as using a VPN service, a reverse proxy, etc. However, these often require installing additional packages and root permissions to manipulate network configurations.

Cloudflare offers a tunnel service that can be easily installed by downloading the cloudflared binary. In this blog post, I’ll explain the steps needed to set up an SSH tunnel using cloudflared.

### 1. Download and install cloudflared

Source code of cloudflared is on [github](https://github.com/cloudflare/cloudflared). You can download a prebuilt binary from the [release](https://github.com/cloudflare/cloudflared/releases).

If your OS doesn’t have a prebuilt binary, you can also compile it using Go.

The cloudflared binary can be placed anywhere, but I recommend putting it somewhere in your `$PATH`.

### 2. Configure `cloudflared`

To use `cloudflared` for tunneling, you’ll need a Cloudflare account (a free plan works), and a domain pointed to Cloudflare’s nameservers.

Start by logging in to your Cloudflare account with the following command:

```bash
cloudflared tunnel login
```

This will open your browser and prompt you to log in to your Cloudflare account.

Next, create a new tunnel:

```bash
cloudflared tunnel create <tunnel-name>

# Example:
cloudflared tunnel create my-tunnel
```

You can view all your tunnels using:

```bash
cloudflared tunnel list
```

Each tunnel will have an ID and a name. You’ll use the tunnel ID in your configuration file.

Now, configure the tunnel by creating a file at `~/.cloudflared/config.yaml`:

```yaml
tunnel: <your-tunnel-id>
credentials-file: ~/.cloudflared/<your-tunnel-id>.json
ingress:
  - hostname: <your-subdomain>
    service: ssh://localhost:22
  - service: http_status:404
```

In the `hostname` field, specify a subdomain (from a domain managed by Cloudflare). For example: `mytunnel.monotone.dev`.

More information on the `config.yaml` format is available in the [Cloudflare documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/configuration-file/).

### 3. Set Up the Route

Next, tell Cloudflare how to route traffic to your server by running:

```bash
cloudflared tunnel route dns <your-tunnel-name> <your-subdomain>

# Example:
cloudflared tunnel route dns my-tunnel mytunnel.monotone.dev
```

Then, start the tunnel:

```bash
cloudflared tunnel run my-tunnel
```

### 4. Connect to Your Private Server

Now, from another computer, you can connect to your private server. On that computer, you also need to install the `cloudflared` command and authorize it with your Cloudflare account.

Update your SSH config (`~/.ssh/config`) with a new entry:

```ssh
Host mytunnel.monotone.dev
  ProxyCommand cloudflared access tcp --hostname %h
```

Now you can SSH into your private server using:

```bash
ssh mytunnel.monotone.dev
```

