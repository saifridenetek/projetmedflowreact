# ⚡ Déploiement Kubernetes - Guide Rapide

## 🎯 Vue d'ensemble (100% GRATUIT)

```
GitHub → GitHub Actions → Docker Hub → Kubernetes (Minikube)
         (CI/CD gratuit)   (Gratuit)    (Local gratuit)
```

**Temps total : 1-2 heures**
**Coût : 0€**

---

## 🚀 Les 10 étapes

### 1️⃣ Docker Hub (5 min)
```
1. Créer compte sur https://hub.docker.com
2. Créer repos: medflow-backend, medflow-frontend
3. Créer Access Token (Settings → Security)
```

### 2️⃣ GitHub Secrets (2 min)
```
Repo → Settings → Secrets → Actions:
- DOCKER_USERNAME = votre_username
- DOCKER_PASSWORD = votre_access_token
```

### 3️⃣ Modifier les images (3 min)
```
Fichiers à modifier (remplacer "votre-username"):
- k8s/backend-deployment.yaml (ligne 19)
- k8s/frontend-deployment.yaml (ligne 19)
```

### 4️⃣ Push sur GitHub (2 min)
```powershell
git add .
git commit -m "Add Kubernetes config"
git push origin main
```

GitHub Actions va construire les images (5-10 min)

### 5️⃣ Installer Minikube (10 min)
```powershell
choco install minikube
choco install kubernetes-cli
minikube start --driver=docker --cpus=4 --memory=4096
```

### 6️⃣ Modifier les secrets (5 min)
Éditer ces fichiers:
- `k8s/postgres-config.yaml` → Changer le mot de passe
- `k8s/backend-config.yaml` → Changer JWT_SECRET, mots de passe

### 7️⃣ Déployer PostgreSQL (3 min)
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-config.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
```

### 8️⃣ Déployer Backend (3 min)
```powershell
kubectl apply -f k8s/backend-config.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
```

### 9️⃣ Déployer Frontend (3 min)
```powershell
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

### 🔟 Vérifier et tester (5 min)
```powershell
# Voir les pods
kubectl get pods -n medflow

# Attendre que tous soient "Running"
kubectl get pods -n medflow -w

# Tester
curl http://localhost:30002/hello
# Ouvrir: http://localhost:30080
```

---

## 🎯 Accès à l'application

```
Frontend: http://localhost:30080
Backend:  http://localhost:30002/hello
```

---

## 🔄 Mettre à jour

```powershell
# 1. Modifier le code
# 2. Push
git push origin main

# 3. Attendre GitHub Actions (5-10 min)
# 4. Redéployer
kubectl rollout restart deployment/backend -n medflow
kubectl rollout restart deployment/frontend -n medflow
```

---

## 📊 Commandes essentielles

```powershell
# Voir les pods
kubectl get pods -n medflow

# Voir les logs
kubectl logs -f deployment/backend -n medflow
kubectl logs -f deployment/frontend -n medflow

# Dashboard
minikube dashboard

# Redémarrer
kubectl rollout restart deployment/backend -n medflow
kubectl rollout restart deployment/frontend -n medflow

# Nettoyer tout
kubectl delete namespace medflow
```

---

## 💰 Coût total : 0€

- Docker Hub : Gratuit (repos publics)
- GitHub Actions : Gratuit (2000 min/mois)
- Minikube : Gratuit (local)

---

## 🎉 C'est terminé !

Votre application est sur Kubernetes ! 🚀

**Guide complet**: [DEPLOIEMENT_KUBERNETES.md](DEPLOIEMENT_KUBERNETES.md)
