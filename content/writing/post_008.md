---
title: "Neural Nets Playing Pong"
date: "2026-06-08"
summary: ""
---

My first encounter with AI was when I built a Tetris game in high-school with my friend David Dong.
We added an [AI feature](https://github.com/tlulu/Tetris-Platformer/blob/master/AI.java#L53) to place the newly generated Tetris piece onto the map. 
The solution was a brute force one.
It would search through all possible placements on the map and decide on the optimal placement based on how difficult of an opponent we wanted the AI to be,
making me believe that AI didn't mean actual intelligence.
It was only computationally powerful after all. 

It was until I stumbled across [Andrej Kapathy’s blog](https://karpathy.github.io/2016/05/31/rl/) about using a neural net to play pong that absolutely blew my mind.
How is it that we can feed raw pixels to a neural net and expect it to learn pong?
I can't even begin to understand how this works..
Okay let's dive in.

## Game Loop
We enter an infinite loop; on each iteration we read pixels from the screen and perform an action: moving up or down
We pass these pixels into our neural net, which takes in 80x80 pixels as input
and outputs a single number - the probability of going up.
I used Andrej's preprocessing code to read pixels. I also used his idea of computing the difference in frames to indicate motion. Only passing in a single frame won't indicate that the ball is moving.
We sample an action stochastically—moving up or down—and then perform that action.

Now is where things get interesting.
How do we improve our neural net over time?
Unlike supervised learning, where there is labeled data, reinforcement learning needs to label its own data to continue doing actions that lead to positive outcomes.
In the case of pong, we define a reward of +1 when we score a point on the opponent, a -1 reward when a point is scored on us, and a 0 for all other frames.
So most of the time, the reward is 0.

**This is a HUGE challenge.** 

Even if the reward is zero most of the time, we could still have hit the ball successfully multiple times.
Yet when we lose a goal, we invalidate all those good actions we took.
The only time when we account for those good actions is when we actually score.
The assumption is that the training will work as long as we win.
The training might take longer, but we will win eventually, right?
It's really hard to believe this would work.
**But somehow - spolier alert - everything does work..**

We use a discount function to give weight to previous actions that led to a positive outcome.
Say at frame 50 we hit the ball that led to a victory.
The actions prior to that were likely good ones, so they should be accounted for as well.

Finally, we calculate the loss for each action and sum them up.
Then we perform back propagation and update the weights of our neural net.
Now for the loss function..

## Loss Function - The Policy Gradient

Gradient policy is a reinforcement learning technique which adjusts a policy's parameters to maximize rewards. It is represented by this formula:

$$
\nabla_\theta J(\theta) = 
\mathbb{E}{}
\left[
\sum_{t=0}^{T}
\nabla_\theta \log \pi_\theta(a_t \mid s_t)
R_t
\right]

$$

This seems like a big and scary formula, but let's break it down.

$R_t$ is our reward function and $\log \pi_\theta(a_t \mid s_t)$ is our policy function. 
In our case with pong, we assign a probability of `p` for choosing UP and a probability of `(1 - p)` for choosing DOWN.

Essentially we're trying to calculate the expected reward.
$$
\nabla_\theta E[r(x)]=\nabla_\theta \sum_{x}p(x)r(x)
$$
where `r(x)` is our reward, `p(x)` is some probability distribution and $\nabla_\theta$ is the gradient

Using the log derivative trick, this formula turns into:

$$
\nabla_\theta E[r(x)]=E[r(x) \times \nabla_\theta \log p(x)]
$$

We use the expectation function as our loss function to maximize rewards:
$$
L(\theta)=-\sum_{x}r(x) \log \pi \theta
$$

where our policy function is, with `a` as our action of going up or down:

$$
\begin{aligned}
a = 1 &: \quad \log \pi = \log p \\[6pt]
a = 0 &: \quad \log \pi = \log(1-p)
\end{aligned}
$$

$$
\log \pi = a\log p + (1-a)\log(1-p)
$$

Then finally our loss can be expressed as:
$$
L(\theta)=-r(x) \times ( a\log p + (1-a)\log(1-p) )
$$

```python
def loss_fn(reward, y, p):
    # Clamp p to avoid log(0) which leads to -inf and subsequent NaN
    p = torch.clamp(p, 1e-7, 1.0 - 1e-7)
    log_prob = y * torch.log(p) + (1 - y) * torch.log(1 - p)
    return -reward * log_prob
```

## The Final Result!

This is the neural net at the start of training, with random weights.
https://youtu.be/1CYVMcIY0H4

This is the neural net after 15k episodes (315,000 games played)
https://youtu.be/ShC0nQd20Ko

I'm still in awe how it can hold its own against the computer..

## Final Takeaway
It's as if after training, the neural net encodes all ball positions on the map and memorizes all possible ball patterns. 
We managed to have a computer program do all this purely using math, without programming the rules of pong at all.
Now this is a form of intelligence. 

## Code
Here's the full notebook: https://www.kaggle.com/code/tonylu25/playing-pong-with-a-neural-net
The code structure is very similar to Andrej's with the exception of the loss function, discount function, and backpropagation using pytorch.

```python
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE" # For mac users

import gymnasium as gym
import numpy as np 
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from dataclasses import dataclass
import ale_py
import pickle

class NeuralNet(nn.Module):
    def __init__(self):
        super().__init__()

        self.layer1 = nn.Linear(80 * 80, 200) 
        self.layer2 = nn.Linear(200, 1)

    def forward(self, x):
        x = self.layer1(x)
        x = torch.relu(x)
        x = self.layer2(x)
        x = torch.sigmoid(x)
        return x

def preprocess(obs):
    obs = obs[35:195]      # crop
    obs = obs[::2, ::2, 0] # downsample
    obs[obs == 144] = 0
    obs[obs == 109] = 0
    obs[obs != 0] = 1

    return torch.tensor(
        obs.astype(np.float32).ravel()
    )


def loss_fn(reward, y, p):
    # Clamp p to avoid log(0) which leads to -inf and subsequent NaN
    p = torch.clamp(p, 1e-7, 1.0 - 1e-7)
    log_prob = y * torch.log(p) + (1 - y) * torch.log(1 - p)
    return -reward * log_prob

def calculate_discount(actions, gamma=0.99):
    running = 0
    for action in reversed(actions):
        running = action.reward + gamma * running
        action.reward = running

    # Normalize rewards to reduce variance
    rewards = torch.tensor([a.reward for a in actions])
    rewards = (rewards - rewards.mean()) / (rewards.std() + 1e-8)
    for a, r in zip(actions, rewards):
        a.reward = r.item()

    return actions
    
@dataclass
class Action:
    p: float
    y: float
    reward: int

model = NeuralNet()
resume = True
render = True
if resume:
    model = pickle.load(open('save.p', 'rb'))
learning_rate = 1e-4
batch_size = 5
game_count = 0
prev_x = None
actions = []
reward_sum = 0

env = gym.make("ALE/Pong-v5", render_mode="human" if render else None)
observation, _ = env.reset()

while True:
    if render: env.render()
        
    # Read pixels from screen.
    cur_x = preprocess(observation)
    x = cur_x - prev_x if prev_x is not None else torch.zeros_like(cur_x)
    prev_x = cur_x
    
    p = model.forward(x)

    # Choose action
    action = 2 if np.random.uniform() < p.item() else 3 # gymnasium takes UP=2, DOWN=3
    y = 1 if action == 2 else 0 # fake label

    # Perform action
    observation, reward, terminated, truncated, info = env.step(action)

    actions.append(Action(p = p, y = y, reward = reward))
    reward_sum += reward

    if reward != 0: # Pong has either +1 or -1 reward exactly when game ends.
        print('ep %d: rally finished, reward: %f%s' % (game_count, reward, '' if reward == -1 else ' !!!!!!!!'))

    # Game has ended
    if terminated or truncated:
        game_count += 1
        
        if (game_count % batch_size == 0):
            loss = 0
            actions = calculate_discount(actions)
            for action in actions:
                loss += loss_fn(action.reward, action.y, action.p)
            model.zero_grad()
            loss.backward()
            # update weights
            with torch.no_grad():
                for p in model.parameters():
                    p -= learning_rate * p.grad
                    
            actions = []

            # The NN ended up getting so good that the loss function returned -inf
            for param in model.parameters():
                if torch.isnan(param).any():
                    raise ValueError("NaN detected in model parameters! Aborting save to prevent corruption.")

            pickle.dump(model, open('save.p', 'wb'))

        print('resetting env. game reward total was %f', reward_sum)
        observation, info = env.reset()
        prev_x = None
        reward_sum = 0

```