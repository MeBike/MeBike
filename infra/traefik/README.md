# Traefik

This stack centralizes VPS ingress for MeBike and any other Docker app that joins the shared `traefik-public` network.

## Files

- `compose.yaml`: Traefik container and shared Docker network.
- `traefik.yaml`: static Traefik configuration.
- `.env.example`: variables required by the stack.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `CLOUDFLARE_DNS_API_TOKEN` to a token that can manage DNS for the required zones.
3. Set `TRAEFIK_DASHBOARD_USERS` to an htpasswd entry, for example:

```bash
htpasswd -nbB your-user your-password
```

4. Create writable directories on the VPS:

```bash
mkdir -p infra/traefik/letsencrypt infra/traefik/logs
touch infra/traefik/letsencrypt/acme.json
chmod 600 infra/traefik/letsencrypt/acme.json
```

5. Start Traefik:

```bash
docker compose -f infra/traefik/compose.yaml up -d
```

## Migration From Skindora-Owned Traefik

1. Copy `/home/amogus/skindora/letsencrypt/acme.json` into `infra/traefik/letsencrypt/acme.json` if you want to preserve existing certificates.
2. Copy the valid Cloudflare token into `infra/traefik/.env`.
3. Stop the old Traefik before starting the new one, because both bind to ports `80` and `443`.
4. Leave app containers attached to `traefik-public`; they do not need their own Traefik instances.
5. Start the new Traefik stack and verify the dashboard and routed domains.

## MeBike Deploy

The MeBike app stack in `compose.vps.yaml` already expects a shared external network named `traefik-public` and a certificate resolver named `default`.
