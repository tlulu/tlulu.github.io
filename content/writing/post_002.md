---
title: "Stuck Payments on the Lightning Network"
date: "2024-04-19"
summary: "A fundamental issue on the Lightning Network that impacts user experience — stuck payments, how they occur, and the protocol designs to address them."
---

Happy Halvening day! The fees in the network as of writing this article is insane. So many inscriptions in this [block](https://ordiscan.com/block/840000).

![Mempool high fee block rate](/images/content/post_002/mempool.png)
*(Friday, April 19, 2024, at 5:39 pm PST via mempool.space)*

While the lightning network is being battle tested in the high fee environment, I want to point out another issue with lightning. **A bigger and more fundamental issue that I don't see many people talking about — stuck payments.**

## Stuck Payments

For the past 2 years, I have worked on a consumer mobile app that can allow users to send payments through lightning. The biggest UX pain point that I see are stuck payments. This is when a payment is initiated through lightning, but doesn't receive a success or failure response back.

Suppose A is trying to pay D and the payment goes through this route where A pays B, B pays C, C pays D.

![Lightning Payment Route Animation](https://voltage.cloud/wp-content/uploads/2023/06/image.gif)
*([Credit Voltage's amazing visualization](https://voltage.cloud/wp-content/uploads/2023/06/image.gif))*

If any participant along this path goes offline, then the payment gets stuck. It is only when the participant comes back online can the payment move forward.

Each payment along the route is a contract called an HTLC. The basic premise of an HTLC is this: the sender commits to sending their money to the receiver, only when the receiver reveals a secret. Otherwise, the sender gets their money back after a specific time period.

If B goes offline for an extended period of time, then C will have no choice but to force close the channel, broadcasting the latest commitment transaction to the blockchain. This reveals the secret and gives B a period of time to get their funds from A. If B doesn't claim the payment from A, then they just lost their money.

D technically got their money, but A's payment isn't "complete" until B claims the money which could be days. What a pretty bad UX for A!

Even though the UX is bad, it's important to point out that the system is safe. Only participants who leave the system for whatever reason, are the only ones who risk losing funds, while the rest can get their money back.

Stuck payments are hard to solve in this current system design. Even if the availability of one node is 99%, the total availability of the system is 0.99 * 0.99 * 0.99 * 0.99 = 0.96. One of the reasons why fewer hop payments are more likely to succeed.

In my opinion, lightning's biggest blocker for mainstream adoption is stuck payments because I never want to end up in a situation where I'm standing in line at Starbucks, waiting more than a couple seconds for my payment to go through.

## The Solution?

[PTLCs](https://bitcoinops.org/en/topics/ptlc/) are a newer implementation of HTLCs and they allow the sender to perform retries if the payment is deemed "stuck". The sender could retry with the same route or a different route. Right now, retrying with HTLCs is not safe because it results in double paying. PTLCs involves sizeable protocol changes to lightning and are in the works by the awesome folks at [Spiral](https://twitter.com/cryptoquick/status/1654976403010383874).
