FROM public.ecr.aws/docker/library/caddy:2.11.2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY site/ /srv/