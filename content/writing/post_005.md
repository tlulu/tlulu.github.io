---
title: "Challenges in Defining SLAs for Bitcoin Withdrawals"
date: "2025-01-11"
summary: "The Bitcoin mempool has hit record highs over the past two years. The mempool fee rate has been rising since February 2023 and the predictable old days of 1 sats/vbyte are over. Thank you Ordinals."
---

The Bitcoin mempool has hit record highs over the past two years. The mempool fee rate has been rising since February 2023 and the predictable old days of 1 sats/vbyte are over. Thank you Ordinals.

Some bitcoin wallets offer service-level agreements (SLA) that guarantee that transactions will be confirmed in a certain number of blocks or within a certain time. However, how realistic is this actually? Let's take a look at 1-block confirmation times as an example which n-block confirmations can be extrapolated from it.

## Why 1-block SLA is hard

There are 4 random variables that are inherent in the Bitcoin network that make estimating SLAs difficult:

1. Transaction propagation time
2. Block mining time deltas
3. Probability of a empty block
4. Distribution of fees in the mempool

### 1. Transaction Propagation Time

A transaction does not reach a majority of miners instantaneously, it must propagate. It takes time to reach all the miners in the network.

![Transaction propagation delay](/images/content/post_005/propagation_delay.png)
*The Transaction propagation delay PDF from [dsn.kastel.kit.edu](https://www.dsn.kastel.kit.edu/bitcoin/#propagation). Note that the expected value is around 30 seconds.*

The [mempool.space](http://mempool.space) codebase uses 180s (3 minutes) as the default propagation delay ([here](https://github.com/mononaut/mempool/blob/bee573fdb857445ee3fdc208ddb5ac1448890e24/backend/src/api/audit.ts#L4)) before considering a transaction to have a high enough probability of being included in a block.

### 2. Mining Time Delta

The average time for a block to be mined is ~10 minutes. However, this time could vary based on different environment conditions. Sometimes a block can be mined in an hour, or a group of blocks can be mined in succession in the span of 5 minutes.

![Mining time deltas](/images/content/post_005/mining.png)
*Taken from Feb 7, 5:15pm PST from [mempool.observer](https://mempool.observer/#past-blocks)*

### 3. Probability of an Empty Block

There are cases when a block is empty and there are no transactions in it except for the coinbase transaction. In this scenario, guaranteeing a next block withdrawal is impossible. Here is one [example](https://mempool.space/block/00000000000000000001e3b80ea60912e9dc16ba90271f66eb857a8bf5b08b72).

This occurs because mining pools send an empty block template, to maximize time miners can start searching for the next block.

According to [Braiins](https://braiins.com/blog/why-pools-mine-empty-blocks-and-how-stratum-v2-fixes-this):

> Empty block mining has become less and less common over the years, but unfortunately there are still 3-4 empty blocks mined per week on average.

### 4. Distribution of Fees in the Mempool

Bitcoin miners are incentivized to select transactions with the highest fees in the mempool to include in the next block. However, Block space is limited and we could be outbid by others in the market. There are [fee estimates](https://bitcoiner.live/) to give a higher degree of confidence, but things could change drastically if more withdrawals are being made. This is highly dependent on network conditions.

## What's a good SLA definition?

We have a couple options to define SLAs:

1. Define SLA in terms of block time: a 1 block SLA
2. Define SLA in terms of clock time: a 10 minute SLA

### Scenario 1: Block time SLA

Suppose we broadcast at block at 20:08, then the next four blocks are mined at 20:11, 20:13, 20:16, and 20:26. Which one do we consider our "target"? Suppose we get into the 4th block, which was 18 minutes since broadcast time, but only 15 minutes after the time the transaction was fully propagated.

![Quick block mining](/images/content/post_005/quick_mining.png)

❓ **Question:** Did we meet our objective? Was this "fast enough". Considering what was going on here, even the third block may have been constructed by a miner that may not have received or considered our target transaction, or possibly an **Empty Block.**

❌ If we defined our SLA in terms of 1 blocks, this case would fail.

### Scenario 2: Clock time SLA

In the following scenario, we broadcast a transaction at 15:42, but the next block is not mined until ~16:20, a time delta of 38 minutes!

![Long block time](/images/content/post_005/long_block_time.png)

❓ **Question:** Is this acceptable performance? We got into the next block. But it took nearly 40 minutes from the point of view of the customer! We obviously could not have sped up the mining of that next block in this case.

❌ If we defined our SLA in terms 10 minutes, this case would fail.

## Conclusion - It is IMPOSSIBLE to Guarantee an SLA

Is it impossible to guarantee an SLA due to limited block space. Other motivated parties can have more aggressive strategies to outbid your transaction. The best effort solution is to fee bump aggressively in order to get into the next block. However, even fee bumping may not guarantee a spot due to reasons outlined above. That's just the nature of Bitcoin. There will always be a percentage of transactions that will breach SLA.

## Takeaways

- Propagation time in distributed systems and a limited block space make defining SLAs a tricky problem.
- Defining an SLA is a good benchmark for your system, but it is impossible to guarantee! There will always be a percentage of transactions that will breach SLA and that is something inherent about Bitcoin.
- Aggressive fee bumping is a best effort solution but still doesn't guarantee a 1-block SLA.
