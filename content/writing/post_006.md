---
title: "Neural Nets Recognizing Digits"
date: "2026-05-31"
summary: ""
---

Full notebook: [https://www.kaggle.com/code/tonylu25/digit-recognition-neural-net](https://www.kaggle.com/code/tonylu25/digit-recognition-neural-net)

I just finished this amazing series by 3Blue1Brown to get an intuition for what is a neural net.

https://www.youtube.com/watch?v=aircAruvnKk

Before implementing this model, I wanted to write a hello world version first. 

I stumbled across this gem.

https://www.youtube.com/watch?v=VMj-3S1tku0

Andrej Karpathy guides you through a simple implementation of a neural net using basic primitives built by hand, mirroring the APIs in PyTorch so the code is easily transferrable to code used in production.

```python
import numpy as np 
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

# A simple NN with 2 hidden layers
# 3 inputs, 4 neurons in each hidden layer and one output.
class NeuralNet(nn.Module):
    def __init__(self):
        super().__init__()

        self.layer1 = nn.Linear(3, 4) 
        self.layer2 = nn.Linear(4, 4)  
        self.layer3 = nn.Linear(4, 1)

    def forward(self, x):
        x = self.layer1(x)
        x = F.tanh(x)
        x = self.layer2(x)
        x = F.tanh(x)
        x = self.layer3(x)
        return x

def loss_fn(outputs, targets):
    return sum((o - t)**2 for o, t in zip(outputs, targets))

training_data = torch.tensor([
    [2.0, -3.0, 4.0],
    [1.0, 2.0, -3.0],
    [4.0, -1.0, -2.0],
    [1.0, -1.0, -1.0]
], dtype=torch.float32)

targets = torch.tensor([[1.0], [-1.0], [1.0], [-1.0]], dtype=torch.float32)

model = NeuralNet()
learning_rate = 0.01
iterations = 300

for i in range(iterations):
    # forward pass
    outputs = model(training_data)
    loss = loss_fn(outputs, targets)

    # backward pass
    model.zero_grad() # Reset gradient on each iteration because gradient is originally zero.
    loss.backward()

    # Update weights
    with torch.no_grad(): # Tell pytorch to not do any gradient updating in the background.
        for p in model.parameters():
            p -= learning_rate * p.grad
```

Now to implement the NN for digit recognition

```python
import numpy as np 
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

# A NN with 2 hidden layers
# 28 * 28 inputs, 16 neurons in each hidden layer and 10 outputs (one for each digit).
class NeuralNet(nn.Module):
    def __init__(self):
        super().__init__()

        self.layer1 = nn.Linear(28 * 28, 16) 
        self.layer2 = nn.Linear(16, 16)  
        self.layer3 = nn.Linear(16, 10)

    def forward(self, x):
        x = self.layer1(x)
        x = torch.sigmoid(x)
        x = self.layer2(x)
        x = torch.sigmoid(x)
        x = self.layer3(x)
        x = torch.softmax(x, dim=0)
        return x

def loss_fn(output, target):
    return ((output - target) ** 2).sum()

model = NeuralNet()
learning_rate = 0.01

for i in range(len(x_train)):
    x = torch.tensor(x_train[i], dtype=torch.float32) # x_train is an 60000 x 784 matrix.
    x = x.reshape(-1)  # flatten 28x28 -> 784
    y = torch.tensor(y_train[i], dtype=torch.long) # y_train is an 60000 array of labels.
    
    # forward pass
    output = model(x) # output is a 1x10 matrix
    target_onehot = torch.zeros(10)
    target_onehot[y.item()] = 1.0 # Convert target into a 1x10 matrix
    loss = loss_fn(output, target_onehot)
    
    # backward pass
    model.zero_grad() # Reset gradient on each iteration because gradient is originally zero.
    loss.backward()
    
    # Update weights
    with torch.no_grad(): # Tell pytorch to not do any gradient updating in the background.
        for p in model.parameters():
            p -= learning_rate * p.grad
```

```python
correct = 0
incorrect = 0

for i in range(len(x_test)):
    x = x_test[i]
    y = y_test[i]

    output = model(x)

    prediction_value = output.argmax().item()

    if prediction_value == y.item():
        correct += 1
    else:
        incorrect += 1
        #print(f"predicted: {prediction_value} actual: {y.item()}")

print(f"Accuracy: {100 * correct / (correct + incorrect)}")
```

When I first evaluated its accuracy I got: `Accuracy: 48.9%`

Yikes.

Where did I go wrong.

## ReLU

One suggestion from the video is to use ReLU instead of Sigmoid to represent activation. Sigmoid is nice intuitively because it bounds the output between 0 and 1, representing whether a neuron is activated or not. 

However, in practice it doesn’t work as well as ReLU:

 `f(x) = max(0, x)` 

This function means that for values less than 0, a neuron is not activated and for positive values it is the identity function. Changing our bounding function to ReLU:

```python
def forward(self, x):
        x = self.layer1(x)
        x = torch.relu(x)
        x = self.layer2(x)
        x = torch.relu(x)
        x = self.layer3(x)
        x = torch.softmax(x, dim=0)
        return x
```

Running again..

`Accuracy: 10.28%`

Wow

So maybe the input values were too large. We previously squashed the input with a sigmoid function.

Normalizing the inputs between 0 and 1: 

```python
x = torch.tensor(x_train[i], dtype=torch.float32) / 255.0 
```

```python
x = torch.tensor(x_test[i], dtype=torch.float32) / 255.0
```

`Accuracy: 90.69%`

🤯

Why does normalizing ReLU on the input layer make such a big difference? 

Looking back at this formula: `a = w * x` 

If the input is large, then the activation will be large causing the final output to be large as well. This would cause the loss to balloon as well since the expected output value is a one-hot encoding.

## Hidden Layers

Increasing the size of the hidden layers from 16 neurons to 128 neurons, the accuracy improves to: `Accuracy: 94.78%`

## My Main Takeaways

A neural net is just a huge mathematical function with inputs and outputs.

In a function that recognizing digits, the input is a 28x28 pixel image and the output is a number from 0-9.

There are hidden layers of nodes in between the input and output to get intermediary representations of the output - a 9 would see a `|` in one layer and a `o` in another. That’s the intuition but in reality, the intermediary representations are incomprehensible.

Each node in the graph is represented by this formula: `a = w * x`, inspired by biological synapses. 

`x` is the input; `w` are the weights that can be tuned. I'm ignoring biases to simplify the formulas.

This network learns using supervised learning where we manually label images for training.

For each training data, the network learns by changing its parameters, `w`, across all nodes.

We gradually change the weights of the function so the function can get better and better at predictions.

We do so with a cost (loss) function.

### Cost Function

The cost function here is the mean squared error.   

$$
L(w) = \sum (y_{predicted} - y_{actual})^2
$$

where 
$$
y_{predicted} = \sum (x_i * w_i)
$$

Its inputs are all the weights and biases, thus (28 * 28 * 16 + 16 * 16 + 16 * 10) = 13k parameters.

Its output is a single number: the cost.

To minimize the function, we calculate the gradient of the loss function with respect to each weight, `w_1`, `w_2`…`w_13000`

The gradients are essentially the partial derivatives of the function: `dL/dw1`, `dL/dw2` etc. We update the weights by nudging it by a small amount in the direction of its gradient. 

Calculating the gradients is done backwards, starting from the output layer to the layer input. 

As an example we can see that we can calculate the partial derivative `dL/dw1`, by using the partial derivative `dL/dw2`. By the chain rule: `dL/dw1 = dL/da * da/dw1`

This giant mathematical formula actually mirrors the node structure of the neural net. 

I like to think of the Tensor object in Pytorch representing a variable in the giant math formula, which is a circular node on the graph. 