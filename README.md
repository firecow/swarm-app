# What?
Cow Swarm deploys services to docker swarm in a controlled manner.

# Why?

## Certain things are hard to redeploy 

Updating swarm config's can be a pain. `--config-content-checksum-rewrite` to the rescue.

Going from `replicated` to `global` and vice versa, no problem.

Experiencing `network.alias` bugs, we got you covered.

## What will happen?
`cow_swarm diff` gives a proper overview.

## Was deployment succesful?
`cow_swarm wait` gives a detailed answer.

## Having dublicated yaml across multiple project?
Extends from external source is here to help.
```yml
services:
  mywebserver:
    extends: 
      - { file: https://cow-swarm.firecow.dk/1.0.0/general.yml, service: nginx }
```

## Do I really need external config files?
Nope, you can just inline them, and they even get envsubst'ed. Escape with double dollar.
```sh
export NGINX_FOLDER=html
```

```yml
services:
  nginx:
    configs:
      nginx-conf: |
        location / {
          root ${NGINX_FOLDER};
        }
```

## Confused looking at the yaml?
`cow_swarm.yml` is 100% explicit, no more optionals, no more short syntax.

cow_swarm config isn't docker-compose or docker stack, but it does borrows the good parts.

## Getting deployment errors tools could have found?
`cow_swarm validate` will exit 1 on every little mistake you make.
