# CI/CD y GitOps

## Flujo completo

```mermaid
sequenceDiagram
    actor D as Desarrollador
    participant APP as Repo de aplicación
    participant GA as GitHub Actions
    participant AWS as AWS OIDC y ECR
    participant GIT as Repo GitOps
    participant EKS as Amazon EKS
    D->>APP: Push a main
    APP->>GA: Ejecuta calidad y pruebas
    GA->>AWS: Asume rol con OIDC
    GA->>AWS: Publica imagen con SHA
    GA->>GIT: Actualiza overlay dev
    GIT->>GA: Activa deploy.yml
    GA->>AWS: Obtiene secretos y kubeconfig
    GA->>EKS: Aplica Kustomize
    GA->>EKS: Espera rollouts
```

## Pipelines

| Workflow | Disparador | Resultado |
| --- | --- | --- |
| Frontend `ci-cd.yml` | Push/PR | Lint, TypeScript, build; en main imagen ECR y GitOps |
| Backend `ci-cd.yml` | Push/PR | Tests y auditoría; en main imagen ECR y GitOps |
| GitOps `deploy.yml` | Cambio de base/dev o manual | Secret, Ingress, overlay y rollouts |
| GitOps `promote.yml` | Manual | SHAs existentes a staging/prod y despliegue |
| GitOps `rotate-admin-password.yml` | Manual | Sincroniza secreto bootstrap AWS/Kubernetes |

## Trazabilidad

```mermaid
flowchart LR
    COMMIT[Commit SHA] --> TAG[Etiqueta ECR SHA]
    TAG --> OVERLAY[Overlay Kustomize]
    OVERLAY --> POD[Pod imageID]
    POD --> AUDIT[Historial Actions y Git]
```

La etiqueta debe usar el SHA completo. Para ver el digest ejecutado:

```bash
kubectl -n ciberguate-dev get pods -o jsonpath="{range .items[*]}{.metadata.name}{' '}{.status.containerStatuses[*].imageID}{'\n'}{end}"
```

## Variables y secretos de GitHub

Variables habituales: `AWS_REGION`, `AWS_ACCOUNT_ID`, `EKS_CLUSTER_NAME`, repositorio ECR/GitOps e `INGRESS_SERVICE_TYPE`. Secretos: ARN del rol AWS y llave de despliegue GitOps cuando corresponda. Nunca use access keys AWS de larga duración.

## Fallos

- Una validación fallida detiene la publicación.
- Un push GitOps sólo ocurre después de publicar la imagen.
- `cancel-in-progress: false` serializa despliegues del mismo ambiente.
- Un rollout fallido deja el commit declarativo visible; investigue eventos y revierta a SHAs anteriores.

## Promoción controlada

Antes de staging/prod confirme pruebas, vulnerabilidades, digest disponible, backup reciente, ventana de cambio y plan de reversión. Registre los dos SHAs promovidos en la evidencia del cambio.
