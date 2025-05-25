# What?
Deploy application to docker swarm in a controlled manner.

# Why?

- Rolling update of swarm config, thanks to checksum naming.
- Explicit syntax, no more optionals, no more short syntax.
- Built-in jinja2 style templating via nunjucks

# Usage
- `swarm-app validate` will exit on basic configuration file mistakes.
- `swarm-app diff` gives a proper diff overview of what you are about to deploy.
- `swarm-app deploy` deploys the application.
- `swarm-app wait` waits for deployment to reconcile, and outputs status.

## Inline swarm configs with envsubst
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
