# CiberGuate IA — GitOps y DevOps

Infraestructura declarativa para ejecutar CiberGuate IA localmente y desplegarla en Amazon EKS. Usa Docker Compose, Kubernetes, Kustomize, Amazon ECR, Secrets Manager, CloudFormation, eksctl y GitHub Actions.

Las imágenes desplegadas se identifican con el SHA completo del commit; no se usa `latest`.

## Estructura

- `base/`: PostgreSQL, backend, frontend, Ingress y NetworkPolicy.
- `overlays/dev|staging|prod`: configuración y capacidad por ambiente.
- `infrastructure/aws/`: ECR, secretos, IAM/OIDC y borde público.
- `infrastructure/eksctl/`: clúster y nodos EKS.
- `.github/workflows/`: despliegue, promoción y rotación.
- `docker-compose.yml`: entorno local integrado.

## Documentación

El índice completo está en [docs/README.md](docs/README.md):

- [Arquitectura de solución](docs/solution-architecture.md)
- [Ambientes y Kustomize](docs/environments-and-kustomize.md)
- [CI/CD y GitOps](docs/cicd.md)
- [Seguridad y secretos](docs/security-and-secrets.md)
- [Runbook de despliegue](docs/deployment-runbook.md)
- [Operación, observabilidad y DR](docs/operations-observability-dr.md)
- [Desarrollo local](docs/local-development.md)
- [Costos y retiro](docs/costs-and-decommission.md)

Entorno dev: <https://100.49.206.62.nip.io>.

Antes de aplicar manifiestos:

```bash
kubectl kustomize overlays/dev
kubectl kustomize overlays/staging
kubectl kustomize overlays/prod
```

`base/secret.template.yaml` es únicamente un contrato y no contiene valores reales.
