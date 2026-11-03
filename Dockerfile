FROM public.ecr.aws/docker/library/alpine:latest

COPY Caddyfile /etc/caddy/Caddyfile
COPY site/ /srv/