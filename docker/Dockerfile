FROM caddy:2-alpine

# The official image points these at /data and /config, which only root may write. This container runs
# unprivileged and terminates no TLS, so it needs neither — but Caddy still wants somewhere to put its
# storage, and refusing to start is how it says so.
ENV XDG_DATA_HOME=/tmp XDG_CONFIG_HOME=/tmp

COPY docker/Caddyfile.generated /etc/caddy/Caddyfile

COPY staging/gateway /srv/gateway
COPY staging/admin /srv/admin
COPY staging/operator /srv/operator

USER 1201:1201
EXPOSE 8080
