---
title: "Canary Deployment with Kubernetes"
date: "2026-07-31"
summary: ""
---

What’s brilliant about Kubernetes is how easily it lets you build scalable and highly available systems.
In one of my previous projects, we desperately needed canary deployments.
At a certain point, deploying all our pods became a high risk of causing downtime.
For our mission critical services, that's non-negotiable.
Instead, we needed to deploy a single pod, verify logs and metrics, let the service bake for a day, before promoting the rest of the pods.
I wanted to made Captain, a deployment dashboard, to experiment with this canary feature.

![Dead Poets Society - Oh Captain My Captain](https://media.giphy.com/media/H1OiJv9BIp7Z6/giphy.gif)

I built two docker images of a simple Axum Rust application

```rust
async fn test(Query(params): Query<HashMap<String, String>>) -> String {
    let param = params.get("param").map_or("unknown", String::as_str);
    println!("Received request, {}!", param);
    tokio::time::sleep(Duration::from_secs(1)).await;
    return format!("Processed request, {}!", param);
}
```

`docker.io/library/captain:2.0` - is the above application
`docker.io/library/captain:3.0` - same but prints V2!
I also used Axum for the dashboard backend because I wanted to write more Rust.
A simple client continuously pings our server.

```bash
#!/bin/bash

# Spin up a temporary container that runs in the same network as our Kind Node.
# and curl the NodePort.
for i in {1..30}; do
  docker run --rm --network kind curlimages/curl -s "http://172.21.0.2:30007/test?param=$i"
  echo
done
```

I used a docker container called Kind to simulate a physical K8 node on my local machine. 
K8 uses a rolling deployment strategy by default, so old pods won’t terminate until a new pod has started.
Deployments are declared in yaml files, specifying the state of the deployed application - the number of replicas, image, deployment strategy, etc.
Here’s how the current deployment.yaml looks:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: captain
  labels:
    app: captain
spec:
  replicas: 2
  selector:
    matchLabels:
      app: captain
  template:
    metadata:
      labels:
        app: captain
    spec:
      containers:
        - name: captain
          image: docker.io/library/captain:2.0
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
```

I use a separate manifest declaring the deployment for the canary pod:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: captain-canary 
  labels:
    app: captain
    version: canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: captain
      version: canary
  template:
    metadata:
      labels:
        app: captain
        version: canary
    spec:
      containers:
        - name: captain
          image: docker.io/library/captain:3.0
          imagePullPolicy: Never
          ports:
            - containerPort: 3000

```

After applying the manifest, K8 starts a new canary pod. 
Requests from the client route to both old pods and the new canary pod.

`service.yaml` defines the network access into the pods.
In this local set up, the Kind Node represents a real physical machine running on:  http://172.21.0.2:30007
Internally, K8 creates iptable rules that maps requests from http://172.21.0.2:30007 to the individual pod sockets (`10.244.0.5:3000`)
Each request is distributed equally to each pod using a round-robin strategy.

After verifying that the canary pod runs smoothly, I remove the canary pods and apply the deployment.yaml manifest with `docker.io/library/captain:3.0 `

Both the client and server experience zero downtime.

Here is the final result: https://youtu.be/TpJi42t8aEE

Full code: [https://github.com/tlulu/captain](https://github.com/tlulu/captain)
