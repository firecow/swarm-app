# What?
Swarm-App deploys services to docker swarm in a controlled manner.

# Why?

## Certain things are hard to redeploy 

Updating swarm config's used to be a pain, but not anymore.

Going from `replicated` to `global` and vice versa, no problem.

## What will happen?
`swarm-app diff` gives a proper overview.

## Was deployment succesful?
`swarm-app wait` gives a detailed answer.

## Getting deployment errors tools could have found?
`swarm-app validate` will exit with errors on configuration mistake.

## Confused looking at the yaml?
`swarm-app.yml` is very explicit, no more optionals, no more short syntax.

swarm-app config isn't docker-compose or docker stack, but it does borrow the good parts.

## Duplicated yaml across multiple project?
Extends from external source is here to help.
```yml
services:
  mywebserver:
    extends: 
      - { file: https://swarm-app.firecow.dk/1.0.0/general.yml, service: nginx }
```

## Do I really need source files for configs?
Nope, you can just inline them, they even get envsubst'ed.
Escape with double dollar.
```sh
export NGINX_FOLDER=html
```

```yml
services:
  nginx:
    configs:
      /etc/nginx/conf.d/default.conf:
        content: |
          server {
            location / {
              root ${NGINX_FOLDER};
            }
          }
```
