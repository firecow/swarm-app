# What?
Deploy application to docker swarm in a controlled manner.

# Why?

- Rolling update of swarm config, thanks to checksum naming
- Explicit syntax, no more optionals, no more short syntax
- [Built-in jinja2 style templating via nunjucks](./examples/swarm-app.yml?plain=1#L13)
- [Inline swarm configs](./examples/swarm-app.yml?plain=1#L32)

# Usage
- `swarm-app validate` will exit on basic configuration file mistakes.
- `swarm-app diff` gives a proper diff overview of what you are about to deploy.
- `swarm-app deploy` deploys the application.
- `swarm-app wait` waits for deployment to reconcile, and outputs status.
