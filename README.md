# What?
Cowswarm deploys services to docker swarm in a controlled manner.

# Why?

## Certain things are hard to redeploy 

Updating swarm config's used to be a pain, but not anymore.

Going from `replicated` to `global` and vice versa, no problem.

Experiencing `network.alias` bugs, we got you covered.

## What will happen?
`cowswarm diff` gives a proper overview.

## Was deployment succesful?
`cowswarm wait` gives a detailed answer.

## Getting deployment errors tools could have found?
`cowswarm validate` will exit with errors on every configuration mistake.

## Duplicated yaml across multiple project?
Extends from external source is here to help.
```yml
services:
  mywebserver:
    extends: 
      - { file: https://cow-swarm.firecow.dk/1.0.0/general.yml, service: nginx }
```

## Do I really need external config files?
Nope, you can just inline them, they even get envsubst'ed.
Escape with double dollar.
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
`cowswarm.yml` is very explicit, no more optionals, no more short syntax.

cowswarm config isn't docker-compose or docker stack, but it does borrow the good parts.
