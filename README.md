# cow_swarm

All in one docker stack diff, deploy and wait, plus various improvements

# Why?

## Certain things are hard to redeploy 

Redeploy swarm config's can be hard. `--config-content-checksum-rewrite` to the rescue

Going from `replicated` to `global` and vice versa, no problem

Experiencing `network.alias` bugs, we got you covered

## What will happen?
`cow_swarm diff` gives a proper overview

## Was deployment succesful?
`cow_swarm wait` gives a detailed answer

## Extending services from remote

```yml
services:
  mywebserver:
    extends: { file: https://cow-swarm.firecow.dk/1.0.0/services.yml, service: nginx }
```

## Inline config/secret content

```yml
configs:
  nginxcnf:
    content: |
      location / {
        root html;
      }
```