# 🚀 Déploiement Kubernetes - MedFlow (GRATUIT)

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE KUBERNETES                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub Repository                                           │
│       ↓                                                      │
│  GitHub Actions (CI/CD)                                      │
│       ↓                                                      │
│  Docker Hub (Images)                                         │
│       ↓                                                      │
│  Kubernetes Cluster (Minikube/K3s local)                    │
│  ┌────────────────────────────────────────────────┐         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │         │
│  │  │ Frontend │  │ Backend  │  │ PostgreSQL   │ │         │
│  │  │   Pod    │  │   Pod    │  │     Pod      │ │         │
│  │  │  (React) │  │ (NestJS) │  │  (Database)  │ │         │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │         │
│  │       │             │                │         │         │
│  │  ┌────┴─────────────┴────────────────┴──────┐  │         │
│  │  │         Kubernetes Services              │  │         │
│  │  │  (LoadBalancer / NodePort / Ingress)     │  │         │
│  │  └───────────────────────────────────────────┘  │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  Coût: 0€ (100% gratuit avec Minikube local)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prérequis

### Logiciels à installer

1. **Docker Desktop** (inclut Kubernetes)
   - Windows: https://www.docker.com/products/docker-desktop
   - Ou Docker Engine + Minikube

2. **kubectl** (outil CLI Kubernetes)
   ```powershell
   # Windows avec Chocolatey
   choco install kubernetes-cli
   
   # Ou télécharger: https://kubernetes.io/docs/tasks/tools/
   ```

3. **Minikube** (cluster Kubernetes local)
   ```powershell
   choco install minikube
   ```

4. **Git** (déjà installé normalement)

---

## 🏗️ Structure du projet

Créons la structure pour Kubernetes :

```
ProjectReactMedFlow/
├── .github/
│   └── workflows/
│       └── docker-build.yml      # GitHub Actions CI/CD
├── backend/
│   ├── Dockerfile                # Image Docker backend
│   ├── .dockerignore
│   └── k8s/
│       ├── deployment.yaml       # Déploiement backend
│       ├── service.yaml          # Service backend
│       └── configmap.yaml        # Configuration
├── frontend/
│   ├── Dockerfile                # Image Docker frontend
│   ├── .dockerignore
│   └── k8s/
│       ├── deployment.yaml       # Déploiement frontend
│       └── service.yaml          # Service frontend
└── k8s/
    ├── namespace.yaml            # Namespace medflow
    ├── postgres-deployment.yaml  # Base de données
    ├── postgres-service.yaml
    ├── postgres-pvc.yaml         # Persistent Volume Claim
    └── ingress.yaml              # Routage HTTP
```

---

## 📦 Étape 1: Préparer Docker Hub

### 1. Créer un compte Docker Hub (GRATUIT)
```
1. Aller sur https://hub.docker.com
2. Créer un compte gratuit
3. Noter votre username (ex: johndoe)
```

### 2. Créer les repositories
```
1. Sur Docker Hub → Repositories → Create Repository
2. Créer: medflow-backend (Public)
3. Créer: medflow-frontend (Public)
```

---

## 🔧 Étape 2: Configurer GitHub Secrets

### Dans votre repo GitHub:
```
1. Settings → Secrets and variables → Actions
2. New repository secret:
   - Name: DOCKER_USERNAME
   - Value: votre_username_dockerhub
   
3. New repository secret:
   - Name: DOCKER_PASSWORD
   - Value: votre_mot_de_passe_dockerhub
```

⚠️ **IMPORTANT**: Utilisez un Access Token plutôt qu'un mot de passe !
```
Docker Hub → Account Settings → Security → New Access Token
```

---

## 🐳 Étape 3: Construire les images Docker localement (Test)

### Backend
```powershell
cd backend
docker build -t votre-username/medflow-backend:latest .
docker run -p 3002:3002 votre-username/medflow-backend:latest
# Tester: curl http://localhost:3002/hello
```

### Frontend
```powershell
cd frontend
docker build -t votre-username/medflow-frontend:latest .
docker run -p 8080:80 votre-username/medflow-frontend:latest
# Ouvrir: http://localhost:8080
```

---

## 📤 Étape 4: Pousser sur GitHub

Les images seront construites automatiquement par GitHub Actions.

```powershell
git add .
git commit -m "Add Kubernetes and Docker config"
git push origin main
```

Vérifier sur GitHub:
- Actions → Voir le workflow en cours
- Après ~5-10 minutes, les images seront sur Docker Hub

---

## ☸️ Étape 5: Installer Kubernetes (Minikube)

### Installation Minikube
```powershell
# Avec Chocolatey
choco install minikube

# Ou télécharger: https://minikube.sigs.k8s.io/docs/start/
```

### Installation kubectl
```powershell
choco install kubernetes-cli
```

### Démarrer Minikube
```powershell
minikube start --driver=docker --cpus=4 --memory=4096
# Attendre 2-3 minutes
```

### Vérifier
```powershell
kubectl version
kubectl cluster-info
```

---

## 🚀 Étape 6: Déployer sur Kubernetes

### 1. Créer le namespace
```powershell
kubectl apply -f k8s/namespace.yaml
```

### 2. Créer les secrets et configmaps

⚠️ **IMPORTANT**: Modifier les secrets avant !

Éditer `k8s/postgres-config.yaml` et `k8s/backend-config.yaml`:
```yaml
# Changer les mots de passe !
POSTGRES_PASSWORD: "votre_password_securise"
JWT_SECRET: "votre_secret_jwt_64_caracteres"
STRIPE_SECRET_KEY: "sk_live_votre_cle"
STRIPE_WEBHOOK_SECRET: "whsec_votre_secret"
```

Appliquer:
```powershell
kubectl apply -f k8s/postgres-config.yaml
kubectl apply -f k8s/backend-config.yaml
```

### 3. Déployer PostgreSQL
```powershell
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
```

Attendre que PostgreSQL démarre:
```powershell
kubectl get pods -n medflow -w
# Attendre que postgres soit "Running"
```

### 4. Déployer le Backend

⚠️ **Modifier l'image dans `k8s/backend-deployment.yaml`**:
```yaml
image: votre-username/medflow-backend:latest
```

Déployer:
```powershell
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
```

### 5. Déployer le Frontend

⚠️ **Modifier l'image dans `k8s/frontend-deployment.yaml`**:
```yaml
image: votre-username/medflow-frontend:latest
```

Déployer:
```powershell
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

---

## ✅ Étape 7: Vérifier le déploiement

### Voir tous les pods
```powershell
kubectl get pods -n medflow
```

Vous devez voir:
```
NAME                        READY   STATUS    RESTARTS
backend-xxxxx               1/1     Running   0
backend-yyyyy               1/1     Running   0
frontend-xxxxx              1/1     Running   0
frontend-yyyyy              1/1     Running   0
postgres-xxxxx              1/1     Running   0
```

### Voir les services
```powershell
kubectl get services -n medflow
```

### Voir les logs
```powershell
# Backend
kubectl logs -f deployment/backend -n medflow

# Frontend
kubectl logs -f deployment/frontend -n medflow

# PostgreSQL
kubectl logs -f deployment/postgres -n medflow
```

---

## 🌐 Étape 8: Accéder à l'application

### Obtenir l'URL Minikube
```powershell
minikube service frontend-service -n medflow --url
minikube service backend-service -n medflow --url
```

Ou directement via NodePort:
- **Frontend**: http://localhost:30080
- **Backend**: http://localhost:30002

### Tester
```powershell
# Backend
curl http://localhost:30002/hello

# Frontend
# Ouvrir dans le navigateur: http://localhost:30080
```

---

## 🔄 Étape 9: Mettre à jour l'application

### Workflow automatique:
```powershell
# 1. Modifier le code
# 2. Push sur GitHub
git add .
git commit -m "Update feature"
git push origin main

# 3. GitHub Actions build automatiquement
# 4. Attendre 5-10 minutes
# 5. Redéployer sur K8s
kubectl rollout restart deployment/backend -n medflow
kubectl rollout restart deployment/frontend -n medflow
```

### Voir le statut du déploiement
```powershell
kubectl rollout status deployment/backend -n medflow
kubectl rollout status deployment/frontend -n medflow
```

---

## 📊 Commandes utiles

### Monitoring
```powershell
# Dashboard Kubernetes
minikube dashboard

# Voir les ressources
kubectl top nodes
kubectl top pods -n medflow

# Voir les événements
kubectl get events -n medflow --sort-by='.lastTimestamp'
```

### Debugging
```powershell
# Logs d'un pod spécifique
kubectl logs <pod-name> -n medflow

# Logs en temps réel
kubectl logs -f <pod-name> -n medflow

# Se connecter à un pod
kubectl exec -it <pod-name> -n medflow -- /bin/sh

# Décrire un pod (voir les erreurs)
kubectl describe pod <pod-name> -n medflow
```

### Scaling
```powershell
# Augmenter le nombre de replicas
kubectl scale deployment/backend --replicas=3 -n medflow
kubectl scale deployment/frontend --replicas=3 -n medflow

# Voir le nombre de replicas
kubectl get deployments -n medflow
```

### Nettoyage
```powershell
# Supprimer tout le namespace (ATTENTION!)
kubectl delete namespace medflow

# Supprimer un déploiement spécifique
kubectl delete deployment backend -n medflow

# Redémarrer Minikube
minikube stop
minikube delete
minikube start
```

---

## 🎯 Architecture déployée

```
┌─────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                        │
│                      (Minikube)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Namespace: medflow                                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                     │     │
│  │  Frontend Pods (x2)                                │     │
│  │  ├─ medflow-frontend:latest                        │     │
│  │  ├─ Nginx + React build                            │     │
│  │  └─ Port 80                                        │     │
│  │       ↓                                            │     │
│  │  frontend-service (NodePort 30080)                 │     │
│  │                                                     │     │
│  │  ─────────────────────────────────────────────────│     │
│  │                                                     │     │
│  │  Backend Pods (x2)                                 │     │
│  │  ├─ medflow-backend:latest                         │     │
│  │  ├─ NestJS + Node.js                              │     │
│  │  └─ Port 3002                                      │     │
│  │       ↓                                            │     │
│  │  backend-service (NodePort 30002)                  │     │
│  │       ↓                                            │     │
│  │  ─────────────────────────────────────────────────│     │
│  │                                                     │     │
│  │  PostgreSQL Pod (x1)                               │     │
│  │  ├─ postgres:15-alpine                             │     │
│  │  ├─ PersistentVolume (5Gi)                        │     │
│  │  └─ Port 5432                                      │     │
│  │       ↓                                            │     │
│  │  postgres-service (ClusterIP)                      │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Accès externe:                                             │
│  - Frontend: http://localhost:30080                         │
│  - Backend: http://localhost:30002                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Coûts

```
┌──────────────────────────────────────────┐
│  Service          │  Coût               │
├──────────────────────────────────────────┤
│  Docker Hub       │  0€ (Public repos)  │
│  GitHub Actions   │  0€ (2000 min/mois) │
│  Minikube Local   │  0€ (sur votre PC)  │
├──────────────────────────────────────────┤
│  TOTAL            │  0€/mois            │
└──────────────────────────────────────────┘

💡 100% GRATUIT !
```

---

## 🔐 Sécurité en production

### 1. Utiliser des secrets Kubernetes
```powershell
# Créer un secret depuis la ligne de commande
kubectl create secret generic backend-secret \
  --from-literal=DB_PASSWORD=password123 \
  --from-literal=JWT_SECRET=secret123 \
  -n medflow
```

### 2. Network Policies
```yaml
# Isoler PostgreSQL (accès seulement par backend)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-network-policy
  namespace: medflow
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432
```

### 3. Resource Limits
Déjà configurés dans les deployments !
- CPU limits
- Memory limits
- PersistentVolume pour PostgreSQL

---

## 🚀 Pour aller plus loin

### 1. Kubernetes en production (cloud gratuit)

**Options gratuites:**
- **Oracle Cloud Always Free**: 2 VMs gratuites à vie
- **Google Cloud (GKE)**: $300 de crédits gratuits
- **Azure (AKS)**: $200 de crédits gratuits
- **AWS (EKS)**: 12 mois gratuits

### 2. CI/CD avancé
- Ajoutez des tests automatisés
- Déploiement automatique sur K8s
- Blue/Green deployments

### 3. Monitoring
- Prometheus + Grafana
- Elasticsearch + Kibana (logs)
- Jaeger (tracing)

---

## 📚 Ressources

- **Kubernetes**: https://kubernetes.io/docs/
- **Minikube**: https://minikube.sigs.k8s.io/docs/
- **Docker**: https://docs.docker.com/
- **GitHub Actions**: https://docs.github.com/actions

---

## 🎉 Félicitations !

Vous avez déployé MedFlow sur Kubernetes ! 🚀

**Architecture moderne, scalable et 100% gratuite !** 💪

