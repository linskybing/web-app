#! /bin/bash

helm repo add harbor https://helm.goharbor.io
helm repo update

helm fetch harbor/harbor --untar