FROM public.ecr.aws/docker/library/alpine:3.24.3

COPY Caddyfile /etc/caddy/Caddyfile
COPY site/ /srv/