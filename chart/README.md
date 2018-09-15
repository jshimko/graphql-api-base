# Helm Chart

This is the Helm chart for deploying this API on Kubernetes.

```sh
# create custom values file and edit as needed
cp ./chart/values.yaml ./chart/custom-values.yaml

# deploy
helm install --name my-api --namespace example --values custom-values.yaml ./chart
```
