---
title: "Understanding Channel Force Closures"
date: "2024-05-17"
summary: "It took me forever to fully understand the intricacies of channel force closures. This post dives deep into the specific transactions of a force closure."
---

It took me forever to fully understand the intricacies of channel force closures. Sources online were either too high level or too specific about implementation details — this post aims to be an in-between. The content of this post dives into the transactions of a force closure. This post will answer specific questions like:

- What are the outputs in a commitment transaction?
- What transactions will be broadcasted onchain?

## Cooperative Channel Close

To start, let's talk about cooperative channel closures, when life is roses and butterflies.

In a cooperative closure, both parties agree on the final balance and broadcast a closing transaction that contains the wallet outputs for each party.

![Cooperative Channel Close](/images/content/post_003/coop_close.png)
*([Source](https://github.com/lnbook/lnbook/blob/develop/07_payment_channels.asciidoc))*

## Force Channel Close

Force closures happen when one party isn't cooperating with the other, resulting in the counterparty to initiate a force close. In addition, if one party decides to cheat another, then they need to be punished. For force closure, one party publishes the latest commitment transaction.

![Force Channel Close](/images/content/post_003/force_close.png)
*([Source](https://github.com/lnbook/lnbook/blob/develop/07_payment_channels.asciidoc))*

A commitment transaction is the latest state of the channel. If Alice has a channel with Bob, both Alice and Bob have their own version of a commitment transaction with the latest balances.

![Commitment Transaction](/images/content/post_003/commitment_tx.png)
*([Source](https://github.com/lnbook/lnbook/blob/develop/07_payment_channels.asciidoc))*

Each commitment transaction has an output with a locking script that looks like:

```
OP_IF
    # Penalty transaction
    <revocationpubkey>
OP_ELSE
    <to_self_delay>
    OP_CHECKSEQUENCEVERIFY
    OP_DROP
    <local_delayedpubkey>
OP_ENDIF
OP_CHECKSIG
```

The `to_self_delay` timelock allows the counterparty to publish a revocation secret in the event that one party tries to cheat from publishing an old commitment transaction.

Let's look at the revocation path.

## Revocation Secret

When a new commitment transaction is created, it reflects the latest agreed-upon channel state. Each party generates a revocation key and revocation secret for the previous commitment transaction. If a party tries to broadcast an old commitment transaction to the blockchain (attempting to cheat), the counterparty can react by using the revocation secret associated with that old state to claim all the funds in the channel, effectively penalizing the cheating party.

![Revocation Transaction](/images/content/post_003/revocation_tx.png)
*([Source](https://github.com/lnbook/lnbook/blob/develop/07_payment_channels.asciidoc))*

## The Outputs of a Commitment Tx

The commitment tx has 4 different output types for various situations, 3 of which have HTLC locking scripts.

**Suppose Bob is broadcasting his commitment transaction.**

![Commitment Transaction Outputs](/images/content/post_003/commitment_tx_outputs.png)
*([Source](https://github.com/lightning/bolts/issues/553#issuecomment-455641943))*

## 1. Output to Alice

This output is straightforward — there is no locking script. Alice can spend it without constraint.

## 2. Output to Bob

This output goes to Bob with the same locking script mentioned above:

```
OP_IF
    # Penalty transaction
    <revocationpubkey>
OP_ELSE
    <to_self_delay>
    OP_CHECKSEQUENCEVERIFY
    OP_DROP
    <local_delayedpubkey>
OP_ENDIF
OP_CHECKSIG
```

Bob needs to wait `to_self_delay` to give time for Alice to dispute any bad behavior.

## 3. HTLC Offered by Bob

This represents an in-flight HTLC that Bob makes to Alice. For a better understanding of HTLCs I highly recommend reading these posts by [Elle Mouton](https://ellemouton.com/posts/htlc-deep-dive/). By far the best explanations of LN on the internet.

To summarize from Elle:

This contract is essentially a locking script that has 3 conditions to spend it:

1. To HTLC timeout tx address. If the HTLC times out after the `cltv expiry`, then the funds will be sent to a HTLC timeout tx.
2. To Alice's address. Alice can spend if she provides a preimage.
3. To Alice's address. Alice can spend if she provides a revocation secret.

The conditions to spend the HTLC timeout output are:

1. To Bob's address. Bob can spend after `to_self_delay`.
2. To Alice's address. Alice can spend if Alice provides a revocation secret.

**Why is there a separate HTLC-timeout transaction you might ask?**

There are two timeouts that need to be accounted for.

1. `to_self_delay` is related to the commitment transaction and allows time for the counterparty to punish bad behavior.
2. `cltv_expiry` is related to the HTLC and allows the sender to get their money back in the event that the recipient is unresponsive.

Putting both conditions in the same locking script causes problems. If the first spending condition in the locking script were instead:

- To Bob's output, after `to_self_delay` + `cltv_expiry`

This extends the HTLC timeout by `to_self_delay`! This gives extra time for Alice to spend the funds even if the HTLC is expired. A separate transaction is needed to separate this logic.

## 4. HTLC Received by Bob

This represents an in-flight HTLC that Bob receives from Alice.

Again, to summarize from Elle:

This contract is essentially a locking script that has 3 conditions to spend it:

1. To HTLC success tx address. If Bob provides the preimage, then the funds will be sent to a HTLC success tx.
2. To Alice's address. Alice can spend after `cltv_expiry`.
3. To Alice's address. Alice can spend if she provides a revocation secret.

The conditions to spend the HTLC success output are:

1. To Bob's address. Bob can spend after `to_self_delay`.
2. To Alice's address. Alice can spend if Alice provides a revocation secret.

**Why is there a separate HTLC-success transaction you might ask?**

Again, putting both conditions in the same locking script causes problems. If the first spending condition in the locking script were instead:

- To Bob's output, after `to_self_delay` + preimage

Then there's a chance that `to_self_delay` is longer than the `cltv_expiry`, then Alice could claim her funds back even though Bob has the preimage! A separate transaction is needed to separate this logic.

## Why are there two revocation paths?

Because either the commitment tx or the HTLC timeout/success tx can be revoked, depending on which one is published onchain.

## An Example to Sum up

Consider a newly established channel between Alice and Bob. Say, Alice funded the channel with 1 BTC, and 0.1 BTC goes to Bob initially. Each of them has their own version of the initial commitment transaction, each with two outputs: 0.9 to Alice, 0.1 to Bob.

Imagine Alice wants to send 0.2 BTC to Bob.

A new pair of commitment transactions is created, each of them with three outputs: 0.7 to Alice, 0.1 to Bob, and 0.2 as an in-flight HTLC.

Once the HTLC fails/succeeds, as long as both sides commit to the new state, the new commitment transaction will have 2 outputs: 0.7 to Alice, 0.3 to Bob.

Finally, there could be up to 3 layers of onchain transactions from a channel force close. E.g.

1. Commitment tx that spends the funding tx.
2. HTLC timeout / success tx that spends the commitment tx.
3. Revocation tx that spends the HTLC tx.
