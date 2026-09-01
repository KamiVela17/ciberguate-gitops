# CiberGuate GitOps

Repositorio declarativo para desplegar CiberGuate IA en Amazon EKS. Las
imágenes viven en ECR y cada despliegue usa como etiqueta el SHA completo del
commit que produjo la imagen; no se usa `latest`.

## Estructura

- `base/`: recursos comunes de PostgreSQL, backend, frontend, Ingress y red.
- `overlays/dev`: una réplica por aplicación y despliegue automático.
- `overlays/staging`: dos réplicas y promoción manual por SHA.
- `overlays/prod`: tres réplicas, PDB y promoción manual por SHA.
- `infrastructure/aws/bootstrap.yaml`: ECR inmutable, secretos generados, OIDC
  de GitHub y roles IAM con permisos mínimos.
- `infrastructure/eksctl/cluster.yaml`: clúster EKS 1.36 y node group privado.
- `.github/workflows`: despliegue a EKS y promoción entre ambientes.

## Secretos

`base/secret.template.yaml` documenta el contrato del Secret, pero no se aplica
con Kustomize ni contiene valores reales. El workflow obtiene las credenciales
de `ciberguate/<ambiente>/database` en AWS Secrets Manager y crea o actualiza el
Secret `ciberguate-secrets` directamente en el namespace correspondiente. El
workflow combina tres secretos por ambiente: `database`, `auth-admin` y
`auth-signing`.

Nunca agregue contraseñas reales al repositorio.

Para consultar la credencial inicial de desarrollo sin copiarla al repositorio:

```powershell
aws secretsmanager get-secret-value `
  --secret-id ciberguate/dev/auth-admin `
  --query SecretString --output text
```

El correo inicial es `administrador@ciberguate.local`. La API firma sesiones
Bearer con ocho horas de vigencia y protege todas las rutas `/api/v1`, excepto
`/api/v1/auth/login`.

## Acceso web

El ambiente `dev` está publicado en:

[https://100.49.206.62.nip.io](https://100.49.206.62.nip.io)

`infrastructure/aws/public-edge.yaml` crea una instancia EC2 `t3.micro`, una IP
elástica y reglas limitadas hacia el NodePort de NGINX. Certbot instala y
renueva automáticamente el certificado TLS. Este mecanismo evita depender de
port-forward mientras AWS mantiene restringidos ELB y CloudFront para la
cuenta. El enlace permanece estable mientras no se elimine la IP elástica.

Cuando AWS habilite Elastic Load Balancing, puede cambiar la variable
`INGRESS_SERVICE_TYPE` a `LoadBalancer` y retirar el stack perimetral.

## Validación local

```powershell
kubectl kustomize overlays/dev
kubectl kustomize overlays/staging
kubectl kustomize overlays/prod
```

## Infraestructura inicial

```powershell
aws cloudformation deploy `
  --stack-name ciberguate-bootstrap `
  --template-file infrastructure/aws/bootstrap.yaml `
  --capabilities CAPABILITY_NAMED_IAM `
  --region us-east-1

eksctl create cluster -f infrastructure/eksctl/cluster.yaml
```

EKS, los nodos EC2, los balanceadores, NAT Gateway, EBS y Secrets Manager
generan cargos mientras existan. Para retirar el clúster:

```powershell
eksctl delete cluster -f infrastructure/eksctl/cluster.yaml
```

## Flujo CI/CD

1. Un push a `main` en frontend o backend ejecuta pruebas.
2. GitHub Actions obtiene credenciales AWS temporales mediante OIDC.
3. Construye y publica `ECR_REPOSITORY:<github.sha>`.
4. Actualiza el SHA correspondiente en `overlays/dev/kustomization.yaml`.
5. El push GitOps aplica el overlay y espera los rollouts en EKS.
6. `promote.yml` permite llevar dos SHAs ya existentes a staging o producción.
