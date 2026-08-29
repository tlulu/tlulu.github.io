---
title: "My Home VPN"
date: "2021-11-28"
summary: "Setting up a private, DNS-leak-free VPN server at home using Raspberry Pi and Wireguard to access content securely during international travels."
---

During my travels abroad, I wanted to access websites which were blocked in certain countries. A VPN provider like NordVPN would do the job, but I wanted something with more privacy. Historically, there have been data [breaches](https://www.foxnews.com/tech/massive-free-vpn-data-breach-exposes-360-million-records) within VPN providers. It's hard to trust whether VPN providers actually keep logs, sell our data or monitor our traffic. It's totally possible that if they can profit or have to protect themselves, they with share them with other companies.

So I decided to set up my own VPN server at home using Raspberry Pi's and Wireguard.

Why Wireguard you ask? Wireguard was the latest and greatest protocol at the time. OpenVPN was the most mature protocol, but Wireguard had faster performance and had a much simpler implementation (4,000 lines of code versus OpenVPN's 70,000 lines). Futhermore, I could trust in Wireguard's reliability as it was accepted into the Linux kernel.

### My VPN server at home:

![Raspberry Pi setup at home](/images/content/post_001/pi.jpg)

While travelling, my devices would connect to a Raspberry Pi running the Wireguard client. This Pi is connected to the hotel's router and has a secure tunnel to my server running at home. My home router's statically assigned IP address is used to establish the tunnel connection. The nice thing about a client Pi is that it let's me set up an access point in which multiple devices can connect to it at a time.

![VPN Architecture Network diagram](/images/content/post_001/vpn1.png)

I wanted to set up a few backup servers in case my home server crashed or something went wrong with my home internet - Comcast was definitely not reliable. There was one big issue with installing the backups - the building did not assign static IP addresses to individual routers! The way around this was to deploy a separate server on the cloud that had a static IP address and route the request to the VPN server via a long-lived HTTP2 connection.

![Advanced Cloud backup route setup diagram](/images/content/post_001/vpn2.png)

## Final result

The VPN was an overall success. The speed varied from country to country, and it was dependant on my home internet's and the remote internet's reliablity. Sometimes there was 1.5 mB/s download speed, others had 10 mB/s. It wasn't SUPER fast, but it was usable. Most importantly, browsing was reliable, secure and private — there were no DNS leaks at any step and all websites loaded properly 🎉
