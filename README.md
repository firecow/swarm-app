# cow_swarm

All in one docker stack diff, deploy and wait, plus various improvements

## Why?

### Certain things are hard to redeploy 

`--rename-configs` and `--rename-secrets` to the rescue

Changing from `replicated` to `global` and vice versa is handled

`network.alias` bugs are taken care of

---
### What will happen, when i deploy
`cow_swarm diff` gives a proper overview

---
### Was deployment succesful?
`cow_swarm wait` gives a detailed answer

---
### Extending services from remote

```yml
services:
  mywebserver:
    extends: { file: https://cow-swarm.firecow.dk/1.0.0/services.yml, service: nginx }
```

---
### Inline config/secret content

```yml
configs:
  nginxcnf:
    content: |
      location / {
        root html;
      }
```