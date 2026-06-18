FROM public.ecr.aws/docker/library/caddy:2.11.4-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY site/ /srv/