# Arquitectura de solución

## Vista de despliegue

```mermaid
flowchart TB
    USER[Usuario] -->|HTTPS| EIP[Elastic IP y EC2 Edge]
    EIP -->|NodePort restringido| NGINX[Ingress Nginx en EKS]
    NGINX --> FRONT[Frontend React]
    FRONT -->|REST| BACK[Backend Node.js]
    BACK --> PG[(PostgreSQL en EBS)]
    BACK -->|HTTPS opcional| OPENAI[OpenAI]
    BACK -->|OIDC opcional| IDP[Proveedor de identidad]
    SM[AWS Secrets Manager] -->|Workflow materializa Secret| KSEC[Kubernetes Secret]
    KSEC --> BACK
    KSEC --> PG
    ECR[Amazon ECR] --> FRONT
    ECR --> BACK
```

## Componentes AWS

| Componente | Propósito |
| --- | --- |
| EKS | Plano de control administrado para cargas Kubernetes |
| Node group privado | Ejecutar pods sin IP pública directa |
| ECR | Repositorios inmutables de frontend y backend |
| Secrets Manager | Fuente externa de credenciales por ambiente |
| IAM + GitHub OIDC | Credenciales temporales de CI/CD sin access keys persistentes |
| CloudWatch | Logs de API, auditoría y autenticador de EKS |
| EBS CSI | Volumen persistente de PostgreSQL |
| EC2 Edge + EIP | Entrada estable mientras ELB está restringido |

## Arquitectura Kubernetes

```mermaid
flowchart LR
    ING[Ingress] --> FSVC[Service frontend]
    FSVC --> FPOD[Deployment frontend]
    FPOD --> BSVC[Service backend]
    BSVC --> BPOD[Deployment backend]
    BPOD --> PSVC[Service postgres]
    PSVC --> STS[StatefulSet postgres]
    STS --> PVC[(PersistentVolumeClaim)]
```

Cada ambiente usa un namespace `ciberguate-<ambiente>`. NetworkPolicy limita PostgreSQL al backend, frontend al Ingress y backend a frontend; el backend conserva salida DNS, HTTP y HTTPS para diagnóstico e integraciones.

## Acceso público

El stack `public-edge.yaml` instala Nginx y Certbot en una EC2 `t3.micro`, asocia una Elastic IP y permite al borde alcanzar el NodePort del Ingress. Es un diseño transitorio motivado por la restricción de ELB de la cuenta. Cuando ELB esté habilitado, use un NLB/ALB administrado y retire el edge siguiendo el runbook de desmontaje.

## Supuestos

- Región `us-east-1` y clúster `ciberguate-eks`, salvo parametrización explícita.
- Los nodos privados tienen salida a ECR, AWS APIs e Internet mediante la red aprovisionada por eksctl.
- PostgreSQL dentro del clúster es suficiente para el MVP; producción crítica debería evaluar Amazon RDS Multi-AZ.
