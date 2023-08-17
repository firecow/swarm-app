# What?
Deploy application stacks to docker swarm in a controlled manner.

# Why?

- Updating swarm config's used to be a pain, but not anymore.
- docker-compose.yml wasn't designed to docker swarm services, swarm-app.yml is.
- Go from `replicated` to `global` mode without manually removing services.
- `swarm-app.yml` is very explicit, no more optionals, no more short syntax.

## CLI improvements
- `swarm-app validate` will exit on basic configuration file mistakes.
- `swarm-app diff` gives a proper diff like overview of what you are about to deploy.
- `swarm-app wait` waits for deployment to reconcile, and outputs status.

## Config file improvements 
### Extends from external sources.
```yml
services:
  mywebserver:
    extends: 
      - { file: https://swarm-app.firecow.dk/1.0.0/general.yml, service: nginx }
```

### Inline swarm configs with envsubst
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
