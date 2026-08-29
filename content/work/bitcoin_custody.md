---
title: "Block's Bitcoin Custody Platform"
subtitle: "Bitcoin Product Engineer"
date: "2022-2025"
summary: ""
---

There were never-ending, interesting and hard problems to tackle at Block custody. 

Our mission was to power onchain withdrawals/deposits and keep our customers' coins safe across hot and cold storage.

## Extending Custodial Services for SQ merchants 
I segregated our cold, hot and lightning wallets for our Square business unit

We custody bitcoin on behalf of Square merchants and they can accept payments via lightning.

## Hot Wallet Reconciliation
I had the pleasure of building a reconcilation service with [Sanket Kanjalkar](https://sanket1729.github.io/about/).

We needed to reconcile our hot wallet balance with the blockchain.

We created a new watch wallet service to scan the blockchain for UTXOs that belonged to our hot wallet.

To do so, we derived address from our wallet's parent xpub.

Initially we followed a similar approach to bean counter: https://github.com/square/beancounter

But later discovered that the scanning process took too long.

Cash app had millions of addresses.

To speed things up, we used a clever trick: we knew exactly which addresses we’ve issued at a certain point in time. 

This might be considered cheating since this service shouldn’t know any details about the hot wallet other than the xpub.

But it saved time significantly.

Instead of iterating through millions of addresses, we just need iterate through ~300k blocks and build up our UTXO set.

## UTXO Management Under a High Fee Environment
When fee rates are low, everything worked perfectly, costs are minimal.

When ordinals exploded, the mempool was constantly congested, testing the limits of our system.

The team fought fires almost every day.

There were a million problems, but the ones that stuck out to me where the ones that had a million tradeoffs, like stuck consolidations.

We were periodically consolidating transactions, but they got stuck because used a low fee rate.

We couldn’t turn off consolidations because that would make our UTXO pool too large over time, degrading performance.

The whole point of consolidation is to spend small UTXOs under a low fee rate to avoid spending them at a higher fee rate in the future.

But a stuck consolidation transaction, meant our UTXOs would be locked up, cannot be used in other transactions, draining our wallet balance.

The brilliant [Steven Zhao](https://www.linkedin.com/in/zsteven) implemented a mechanism to RBF our consolidations so we can continuously fee bump stuck consolidations. Our only fee bumping mechanism at the time was CPFP.


