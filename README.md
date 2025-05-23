# What?
Deploy application to docker swarm in a controlled manner.

# Why?

- Updating swarm config's used to be a pain, but not anymore.
- docker-compose.yml wasn't designed for docker swarm, swarm-app.yml is.
- `swarm-app.yml` is very explicit, no more optionals, no more short syntax.

## CLI improvements
- `swarm-app validate` will exit on basic configuration file mistakes.
- `swarm-app diff` gives a proper diff overview of what you are about to deploy.
- `swarm-app deploy` deploys the application.
- `swarm-app wait` waits for deployment to reconcile, and outputs status.

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
