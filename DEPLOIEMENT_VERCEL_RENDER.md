# 🚀 Déploiement Vercel + Render

## 📋 Vue d'ensemble

Cette stack offre un déploiement simple et rapide :
- **Frontend** : Vercel (gratuit avec SSL automatique)
- **Backend + DB** : Render (option gratuite pour démarrer)

```
┌─────────────────────────────────────────────┐
│           STACK DE DÉPLOIEMENT              │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend (Vercel)                          │
│  ├─ React + Vite                            │
│  ├─ SSL automatique                         │
│  ├─ CDN global                              │
│  └─ Gratuit                                 │
│                                             │
│  Backend (Render)                           │
│  ├─ NestJS API                              │
│  ├─ PostgreSQL inclus                       │
│  ├─ Déploiement automatique                 │
│  └─ Gratuit (90j) puis 7€/mois             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 💰 Coûts estimés

### Render (Backend + DB)
- **PostgreSQL** : Gratuit (90 jours, puis 7€/mois)
- **Backend** : Gratuit (avec limitations) ou 7€/mois
- **Total** : 0€ (temporaire) ou 7€/mois
- **Avantages** : 
  - Option gratuite pour démarrer et tester
  - Upgrade facile quand nécessaire
  - SSL automatique inclus

### Vercel (Frontend)
- **Gratuit** : Parfait pour les projets personnels
- Inclus : SSL, CDN, analytics basiques

### 🎯 Coût total
- **Phase test** : 0€/mois (90 jours gratuits)
- **Production** : ~7€/mois

---

## 🚀 Guide de déploiement complet

### Étape 1 : Déployer PostgreSQL sur Render

#### 1.1 Créer compte Render
1. Aller sur https://render.com
2. S'inscrire avec GitHub

#### 1.2 Créer PostgreSQL

```bash
# 1. Dashboard → "New" → "PostgreSQL"
# 2. Remplir le formulaire :

# Informations de base
Name: medflow-db
Database: medflow
User: medflow_user
Region: Frankfurt (ou le plus proche de chez vous)

# Datadog (optionnel - LAISSER VIDE)
Datadog API Key: [Laisser vide]
Datadog Region: [Laisser par défaut]

# Plan Options - CHOISIR SELON VOTRE BUDGET :

# Option A : GRATUIT (pour tests - 90 jours)
Instance Type: Free
  - Pour tester Render Postgres
  - RAM: Limité
  - CPU: Partagé
  - Parfait pour développement/démonstration
  - ⚠️ Expire après 90 jours

# Option B : PRODUCTION (recommandé)
Instance Type: Basic-256mb ($6/mois)
  - 256 MB RAM
  - 0.1 CPU
  - Idéal pour hobby/petits projets
  - Pas d'expiration

# Storage (Stockage)
Storage: 1 GB (minimum, suffisant pour démarrer)
  - Coût: GRATUIT pour Free plan
  - Coût: $0.30/mois pour Basic plan
  - Vous pouvez augmenter plus tard si nécessaire

Storage Autoscaling: Disabled (désactivé)
  - Laissez désactivé pour contrôler les coûts

# High Availability (Haute disponibilité)
High Availability: Disabled (désactivé)
  - Disponible uniquement pour plans Pro ($55+/mois)
  - Pas nécessaire pour démarrer

# Résumé des coûts :
# - Free plan: 0€ (90 jours)
# - Basic-256mb + 1GB storage: $6.30/mois (~6€/mois)

# 3. Cliquer "Create Database"
# 4. Attendre 2-3 minutes que la base soit créée
# 5. Copier les informations de connexion (voir étape suivante)
```

#### 1.3 Récupérer les informations de connexion

Après création, Render affiche les informations de connexion :

```bash
# Dans Render Dashboard → PostgreSQL → "medflow-db" → "Info"
# Copier ces valeurs (vous en aurez besoin pour le backend) :

Internal Database URL: postgresql://medflow_user:PASSWORD@dpg-xxxxx-xxxx-frankfurt-postgres.render.com/medflow
External Database URL: postgresql://medflow_user:PASSWORD@dpg-xxxxx-xxxx.frankfurt-postgres.render.com/medflow

Hostname: dpg-xxxxx-xxxx.frankfurt-postgres.render.com
Port: 5432
Database: medflow
Username: medflow_user
Password: [Cliquer sur "Reveal" pour voir]

# ⚠️ IMPORTANT : Notez le mot de passe, vous ne pourrez plus le revoir !
```

### Étape 2 : Déployer Backend sur Render

#### 2.1 Créer Web Service

```bash
# 1. Dashboard → "New" → "Web Service"
# 2. Sélectionner "Build and deploy from a Git repository"
# 3. Connecter votre repo GitHub : saifridenetek/projetmedflowreact

# 4. Remplir le formulaire :

# ===== INFORMATIONS DE BASE =====
Name: medflow-backend
Project: [Optionnel - laisser vide ou créer "MedFlow"]
Environment: Production
Language: Docker (IMPORTANT - choisir Docker, pas Node)
Branch: main
Region: Frankfurt (EU Central)

# ===== CONFIGURATION DOCKER =====
Root Directory: backend
  - IMPORTANT : Le backend est dans le dossier "backend"
  
Dockerfile Path: ./Dockerfile
  - Chemin relatif vers le Dockerfile
  
Docker Build Context Directory: .
  - Le contexte de build (laisser ".")

Docker Command: [Laisser vide]
  - Utilise automatiquement le CMD du Dockerfile

# ===== INSTANCE TYPE =====
# CHOISIR SELON VOTRE BUDGET :

# Option A : GRATUIT (pour tests)
Instance Type: Free
  - 512 MB RAM
  - 0.1 CPU
  - Mise en veille après 15 min d'inactivité
  - Premier accès : 30-60 secondes de délai
  - ⚠️ Pas de zero-downtime deploys

# Option B : PRODUCTION (recommandé)
Instance Type: Starter ($7/mois)
  - 512 MB RAM
  - 0.5 CPU
  - Pas de mise en veille
  - Zero Downtime
  - SSH Access
  - Support

# ===== CONFIGURATION AVANCÉE =====

Health Check Path: /hello
  - Render vérifie que votre API répond sur cette route
  - Notre backend a la route GET /hello qui retourne { message: "Hello from MedFlow API!" }

Pre-Deploy Command: [Laisser vide pour l'instant]
  - On peut ajouter plus tard : npm run typeorm migration:run

Auto-Deploy: On Commit (activé par défaut)
  - Redéploiement automatique à chaque push sur GitHub

Build Filters: [Laisser vide]
  - Optionnel : Ignorer certains fichiers

Disk: [Ne pas ajouter]
  - Pas nécessaire (on utilise PostgreSQL externe)

Secret Files: [Ne pas ajouter]
  - On utilise Environment Variables à la place

Registry Credential: No credential
  - Pas de registre Docker privé

# ===== IMPORTANT =====
# NE PAS cliquer sur "Deploy web service" tout de suite !
# D'abord, ajouter les variables d'environnement (voir section suivante)
```

#### 2.2 Ajouter les Variables d'environnement

**AVANT de cliquer sur "Deploy web service"**, ajoutez toutes les variables d'environnement :

```bash
# Dans le formulaire Render, section "Environment Variables"
# Cliquer sur "Add Environment Variable" pour chaque variable

# ===== CONFIGURATION NODE.JS =====
NODE_ENV = production
PORT = 3002

# ===== BASE DE DONNÉES POSTGRESQL =====
# Copier ces valeurs depuis Render Dashboard → PostgreSQL → "medflow-db" → Info

DB_HOST = dpg-xxxxx-xxxx.frankfurt-postgres.render.com
  ⚠️ Remplacer par votre vraie valeur depuis PostgreSQL "Hostname"

DB_PORT = 5432

DB_USERNAME = medflow_user
  ⚠️ Copier depuis PostgreSQL "Username"

DB_PASSWORD = COPIER_LE_MOT_DE_PASSE_ICI
  ⚠️ IMPORTANT : Cliquer sur "Reveal" dans PostgreSQL pour voir le password
  
DB_DATABASE = medflow

# ===== JWT SECRET =====
JWT_SECRET = votre_secret_jwt_production_changez_moi_abc123xyz789
  ⚠️ CHANGER cette valeur ! Utilisez une chaîne aléatoire sécurisée
  
JWT_EXPIRES_IN = 1d

# ===== FRONTEND URL =====
FRONTEND_URL = http://localhost:5173
  ⚠️ Pour l'instant, mettre localhost
  ⚠️ Vous mettrez à jour avec l'URL Vercel après déploiement frontend

# ===== STRIPE =====
STRIPE_SECRET_KEY = sk_test_VOTRE_CLE_STRIPE_ICI
  ⚠️ Copier depuis Dashboard Stripe → Developers → API keys
  
STRIPE_WEBHOOK_SECRET = whsec_VOTRE_WEBHOOK_SECRET
  ⚠️ Vous ajouterez cette valeur plus tard (après création du webhook)
  ⚠️ Pour l'instant, mettre : whsec_temporaire
```

**Comment ajouter les variables** :

1. **Méthode 1 : Une par une** (recommandé)
   - Cliquer sur **"Add Environment Variable"**
   - Remplir "Key" (ex: `NODE_ENV`)
   - Remplir "Value" (ex: `production`)
   - Répéter pour chaque variable

2. **Méthode 2 : Depuis un fichier .env** (plus rapide)
   - Cliquer sur **"Add from .env"**
   - Coller toutes les variables en format `.env`
   - Render les parse automatiquement

**Exemple de format .env à coller** :
```env
NODE_ENV=production
PORT=3002
DB_HOST=dpg-xxxxx-xxxx.frankfurt-postgres.render.com
DB_PORT=5432
DB_USERNAME=medflow_user
DB_PASSWORD=VOTRE_PASSWORD_ICI
DB_DATABASE=medflow
JWT_SECRET=votre_secret_jwt_production_securise
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_temporaire
```

#### 2.3 Déployer le service

Après avoir ajouté toutes les variables :

1. **Vérifier la configuration**
   - Root Directory: `backend`
   - Language: `Docker`
   - Branch: `main`
   - Health Check Path: `/hello`

2. **Cliquer sur "Deploy web service"**

3. **Attendre le déploiement** (5-10 minutes)
   - Render va :
     - Cloner votre repo GitHub
     - Builder l'image Docker
     - Lancer le conteneur
     - Exécuter les health checks

4. **Vérifier les logs**
   - Dashboard → "Logs" (en temps réel)
   - Chercher : `Nest application successfully started`
   - Chercher : `Application is running on: http://0.0.0.0:3002`

5. **Tester l'API**
   ```powershell
   # Render vous donne une URL comme :
   # https://medflow-backend.onrender.com
   
   curl https://medflow-backend.onrender.com/hello
   
   # Devrait retourner :
   # {"message":"Hello from MedFlow API!"}
   ```

#### 2.4 Mettre à jour FRONTEND_URL (plus tard)

Après avoir déployé le frontend sur Vercel :

1. Render Dashboard → Service "medflow-backend"
2. Aller dans **"Environment"**
3. Trouver la variable `FRONTEND_URL`
4. Modifier la valeur : `https://votre-app.vercel.app`
5. Sauvegarder → Le service redémarre automatiquement

### Étape 3 : Déployer Frontend sur Vercel (5 min)

#### 3.1 Préparer le projet
Créer `frontend/vercel.json` :
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### 3.2 Configurer les variables d'environnement
Créer `frontend/.env.production` :
```env
VITE_API_URL=https://medflow-backend.onrender.com
```

#### 3.3 Déployer sur Vercel
```bash
# 1. Aller sur https://vercel.com
# 2. S'inscrire avec GitHub
# 3. Cliquer "Add New" → "Project"
# 4. Importer votre repo GitHub
# 5. Configurer :

Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist

# 6. Variables d'environnement :
VITE_API_URL=https://medflow-backend.onrender.com

# 7. Cliquer "Deploy"
```

#### 3.4 Mettre à jour Render
```bash
# Retourner sur Render
# Modifier FRONTEND_URL dans les variables backend :
FRONTEND_URL=https://votre-app.vercel.app
```

---

## 🔧 Configuration post-déploiement

### 1. Tester l'API
```powershell
# Tester le backend
curl https://medflow-backend.onrender.com/hello

# Devrait retourner : { message: "Hello from MedFlow API!" }
```

### 2. Tester le Frontend
```
Ouvrir : https://votre-app.vercel.app
Essayer de s'inscrire et se connecter
```

### 3. Configurer Stripe Webhooks (IMPORTANT !)

Les webhooks Stripe permettent à Stripe de notifier votre backend des événements de paiement en temps réel.

#### 3.1 Créer le webhook sur Stripe

1. **Aller sur le Dashboard Stripe**
   - Connectez-vous sur https://dashboard.stripe.com
   - Allez dans **Developers** → **Webhooks**

2. **Ajouter un endpoint**
   - Cliquez sur **"Add endpoint"** ou **"Ajouter un point de terminaison"**
   - Dans **"Endpoint URL"**, entrez **EXACTEMENT** :
     ```
     https://medflow-backend-xd2i.onrender.com/payments/webhook
     ```
   - ⚠️ **Important** : Utilisez l'URL EXACTE de votre backend Render
   - Pour trouver votre URL : Dashboard Render → Service "medflow-backend-xd2i" → en haut, vous voyez l'URL complète

3. **Sélectionner les événements à écouter**
   
   Cliquez sur **"Select events"** et cochez ces événements :
   - ✅ `checkout.session.completed` - Quand un paiement est complété
   - ✅ `payment_intent.succeeded` - Quand un paiement réussit
   - ✅ `payment_intent.payment_failed` - Quand un paiement échoue
   - ✅ `invoice.payment_succeeded` - Pour les abonnements

4. **Créer le webhook**
   - Cliquez sur **"Add endpoint"**

#### 3.2 Récupérer le Signing Secret

Après avoir créé le webhook, Stripe affiche le **Signing Secret** :

1. **Copier le secret**
   - Sur la page du webhook, cherchez **"Signing secret"**
   - Cliquez sur **"Reveal"** ou **"Afficher"**
   - Copiez la valeur qui commence par `whsec_...`
   - Exemple : `whsec_cbb4f4a701423be74c27d3f1e3edbeb6a75d252034f9c42299a08fbc8acff544`

2. **L'ajouter dans Render**
   - Allez sur Render Dashboard
   - Sélectionnez votre service backend **"medflow-backend"**
   - Allez dans **Environment** → **Environment Variables**
   - Cliquez sur **"Add Environment Variable"**
   - Ajoutez :
     ```
     Key: STRIPE_WEBHOOK_SECRET
     Value: whsec_cbb4f4a701423be74c27d3f1e3edbeb6a75d252034f9c42299a08fbc8acff544
     ```
   - Remplacez par votre vraie valeur
   - Cliquez sur **"Save Changes"**

3. **Redémarrer le service**
   - Le service Render redémarre automatiquement
   - Attendez 1-2 minutes

#### 3.3 Tester le webhook

```bash
# Faire un paiement test avec une carte Stripe
# 1. Aller sur votre application déployée
# 2. Créer un rendez-vous
# 3. Aller à la page de paiement
# 4. Utiliser cette carte de test :

Numéro de carte : 4242 4242 4242 4242
Date d'expiration : N'importe quelle date future (ex: 12/28)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe lequel (ex: 12345)

# Le paiement sera validé et le webhook sera appelé automatiquement
```

#### 3.4 Vérifier que ça fonctionne

1. **Dans Stripe Dashboard** :
   - Allez dans **Developers** → **Webhooks**
   - Cliquez sur votre webhook
   - Vous verrez l'historique des événements envoyés
   - Status **"succeeded"** = ✅ Fonctionne

2. **Dans Render Logs** :
   - Dashboard → Service → **Logs**
   - Cherchez les logs contenant `"Webhook received"` ou `"Payment confirmed"`

#### 3.5 En cas de problème

```bash
# Vérifier que l'URL est accessible
curl https://medflow-backend.onrender.com/payments/webhook

# Si erreur 401/403 :
# - Vérifiez que STRIPE_WEBHOOK_SECRET est bien défini dans Render
# - Vérifiez les logs Render pour voir l'erreur exacte

# Si timeout :
# - Le service Render est peut-être en veille (plan gratuit)
# - Attendez 30-60 secondes et réessayez
```

### 4. Vérifier les logs
```bash
# Render : Dashboard → Service → "Logs"
# Vercel : Dashboard → Deployment → "Logs"
```

---

## 🔄 Workflow de mise à jour

```bash
# 1. Faire vos modifications localement
git add .
git commit -m "Update feature"
git push origin main

# 2. Render détecte automatiquement et redéploie le backend (2-3 min)
# 3. Vercel redéploie le frontend automatiquement (1-2 min)

# Temps de déploiement total : 3-5 minutes
```

---

## 📊 Monitoring

### Render (Backend)
```bash
# Dashboard → Service → Metrics
- Response times
- Memory usage
- CPU usage
- Logs en temps réel
- Redéploiement manuel possible
```

### Vercel (Frontend)
```bash
# Dashboard → Analytics
- Page views
- Performance metrics
- Deployment history
- Real User Monitoring (RUM)
```

---

## 🛠️ Commandes utiles

### Voir les logs Render (CLI)
```powershell
# Installer Render CLI
npm install -g render-cli

# Login
render login

# Voir logs
render logs --service medflow-backend

# Redéployer manuellement
render deploy --service medflow-backend
```

### Vérifier le déploiement
```powershell
# Tester le backend
curl https://medflow-backend.onrender.com/hello

# Tester le frontend
curl https://votre-app.vercel.app
```

---

## 🚨 Troubleshooting

### Erreur de connexion DB
```bash
# Vérifier dans Render :
1. DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE sont définis
2. PostgreSQL est bien démarré (Dashboard → PostgreSQL)
3. Les credentials sont corrects

# Vérifier les logs :
render logs --service medflow-backend
```

### Frontend ne peut pas joindre le backend
```bash
# Vérifier :
1. VITE_API_URL pointe vers la bonne URL
2. CORS est configuré dans backend/src/main.ts
3. Le backend répond bien : curl https://backend-url/hello
```

### Build échoue
```bash
# Render :
1. Vérifier package.json contient tous les scripts
2. Vérifier que "build" script existe
3. Vérifier les logs de build dans Render Dashboard
4. Essayer de clear build cache :
   - Dashboard → Service → Settings → Clear Build Cache
5. Redéployer manuellement
```

### Service ne démarre pas (Plan gratuit Render)
```bash
# Le plan gratuit Render met les services en veille après 15 min d'inactivité
# Premier accès peut prendre 30-60 secondes
# Solutions :
1. Upgrade vers plan payant (7€/mois)
2. Utiliser un service de "keep-alive" (ping toutes les 10 min)
3. Accepter le délai au premier accès
```

---

## 💡 Optimisations

### 1. Activer le cache NPM (Render)
Créer `backend/render.yaml` :
```yaml
services:
  - type: web
    name: medflow-backend
    env: node
    buildCommand: npm ci --cache .npm && npm run build
    startCommand: npm run start:prod
```

### 2. Health checks (Automatiques)
```bash
# Render : Automatique sur le path /
# Personnaliser : Settings → Health Check Path
Path: /hello
```

### 3. Upgrade vers plan payant
```bash
# Avantages plan Starter (7€/mois) :
- Pas de mise en veille
- Démarrage instantané
- Plus de ressources (512MB RAM)
- Meilleure performance
```

### 4. Optimiser le cold start
```bash
# Réduire les dépendances
# Utiliser des imports dynamiques
# Optimiser la taille du build
npm run build -- --analyze
```

---

## 📈 Détails de la stack

| Feature | Render (Backend) | Vercel (Frontend) |
|---------|------------------|-------------------|
| **Prix** | Gratuit (90j) puis 7€/mois | Gratuit |
| **Déploiement** | 2-3 minutes | 1-2 minutes |
| **Base de données** | PostgreSQL inclus | Non (pas nécessaire) |
| **SSL** | Automatique (Let's Encrypt) | Automatique |
| **CDN** | Non | Global (Edge Network) |
| **Support** | Email | Email + Documentation |
| **Uptime** | 99.9% (plan payant) | 99.99% |
| **Facilité** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Plan de déploiement recommandé

### Phase 1 : Démarrage (Gratuit - 90 jours)
```
✅ Vercel (Frontend) - Gratuit à vie
✅ Render Free (Backend + DB) - Gratuit 90 jours
💰 Coût : 0€/mois

⚠️ Limitations :
- Backend se met en veille après 15 min d'inactivité
- Premier accès = 30-60 secondes de délai
- Parfait pour développement et tests
```

### Phase 2 : Production (Après 90 jours)
```
✅ Vercel (Frontend) - Gratuit à vie
✅ Render Starter (Backend + DB) - 7€/mois
💰 Coût : 7€/mois

✨ Avantages :
- Pas de mise en veille
- Démarrage instantané
- Performance optimale
- Idéal pour production
```

---

## 📚 Ressources

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Vite Guide](https://vercel.com/guides/deploying-vite-with-vercel)
- [NestJS Production Deployment](https://docs.nestjs.com/faq/deployment)

---

## ✅ Checklist finale

- [ ] Backend déployé et accessible via HTTPS
- [ ] Base de données créée et migrations exécutées
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] CORS configuré pour accepter le domaine Vercel
- [ ] Stripe webhooks configurés
- [ ] Tests de bout en bout effectués
- [ ] Monitoring activé
- [ ] Logs accessibles

---

## 🎉 C'est terminé !

Votre application est maintenant en production avec :
- ✅ Frontend sur Vercel (gratuit, rapide, CDN global, SSL)
- ✅ Backend sur Render (fiable, scalable, SSL automatique)
- ✅ Base de données PostgreSQL (persistante, sécurisée, backups automatiques)
- ✅ Déploiement automatique sur chaque push
- ✅ SSL/HTTPS sur tous les services

**Coût total : 0€ (90 jours) puis 7€/mois**

---

**Guide complémentaire**: [DEPLOIEMENT_KUBERNETES.md](DEPLOIEMENT_KUBERNETES.md) pour une option 100% gratuite avec Kubernetes local
