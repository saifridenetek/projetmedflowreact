# 🔧 Guide : Ajouter les Variables d'Environnement dans Render

## 📋 Contexte

Vous êtes sur la page "New Web Service" de Render et vous devez ajouter les variables d'environnement **AVANT** de cliquer sur "Deploy web service".

---

## 🎯 Étape par Étape

### Étape 1 : Trouver la section "Environment Variables"

Sur la page de création du Web Service, **descendez** jusqu'à la section **"Environment Variables"**.

Vous verrez :
```
Environment Variables
Set environment-specific config and secrets (such as API keys), then read those values from your code. Learn more.

NAME_OF_VARIABLE    value
                    [Generate]

[Add Environment Variable]    [Add from .env]
```

---

### Étape 2 : Choisir la méthode d'ajout

Vous avez **2 méthodes** pour ajouter les variables :

#### 🅰️ Méthode A : Une par une (Simple mais long)

1. **Cliquer sur "Add Environment Variable"**
2. **Remplir le formulaire** :
   - Key (nom de la variable)
   - Value (valeur de la variable)
3. **Répéter** pour chaque variable

#### 🅱️ Méthode B : Depuis un fichier .env (Rapide - RECOMMANDÉE)

1. **Cliquer sur "Add from .env"**
2. **Coller** toutes vos variables en format `.env`
3. **Render parse automatiquement** tout

---

## 🚀 Méthode B : Add from .env (RECOMMANDÉE)

### Étape 1 : Préparer vos variables

Voici les variables à copier (adaptez avec vos vraies valeurs) :

```env
NODE_ENV=production
PORT=3002
DB_HOST=dpg-xxxxx-xxxx.frankfurt-postgres.render.com
DB_PORT=5432
DB_USERNAME=medflow_user
DB_PASSWORD=VOTRE_PASSWORD_POSTGRESQL
DB_DATABASE=medflow
JWT_SECRET=votre_secret_jwt_production_super_securise_changez_moi_xyz123
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_STRIPE
STRIPE_WEBHOOK_SECRET=whsec_temporaire
```

### Étape 2 : Récupérer les vraies valeurs

#### 🔹 Pour PostgreSQL (DB_HOST, DB_PASSWORD)

1. **Ouvrir un nouvel onglet** dans votre navigateur
2. **Aller sur Render Dashboard** → PostgreSQL
3. **Cliquer sur** votre base de données "medflow-db"
4. **Aller dans "Info"** (ou "Connect")
5. **Copier les valeurs** :
   - **Hostname** → Utiliser pour `DB_HOST`
   - **Username** → Déjà : `medflow_user`
   - **Password** → Cliquer sur "👁️ Reveal" → Copier
   - **Database** → Déjà : `medflow`

Exemple de ce que vous verrez :
```
Hostname: dpg-ct12abc34def56789-a.frankfurt-postgres.render.com
Port: 5432
Database: medflow
Username: medflow_user
Password: [👁️ Reveal]  ← Cliquer ici !
```

#### 🔹 Pour Stripe (STRIPE_SECRET_KEY)

1. **Aller sur** https://dashboard.stripe.com
2. **Cliquer sur** "Developers" → "API keys"
3. **Section "Secret key"** → Cliquer sur "👁️ Reveal test key"
4. **Copier** la clé qui commence par `sk_test_...`

#### 🔹 Pour JWT_SECRET

**Générer un secret aléatoire sécurisé** :

```powershell
# Dans PowerShell :
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Ou en ligne :
# https://randomkeygen.com/ → Section "Fort Knox Passwords"
```

Exemple : `a7K9mP2xQ8vL5nB3wR6yT4jC1fG0hD9e`

### Étape 3 : Remplir votre fichier .env

Ouvrez un éditeur de texte (Notepad, VSCode, etc.) et créez ce fichier :

```env
NODE_ENV=production
PORT=3002
DB_HOST=dpg-ct12abc34def56789-a.frankfurt-postgres.render.com
DB_PORT=5432
DB_USERNAME=medflow_user
DB_PASSWORD=xYz123AbC456DeF789GhI
DB_DATABASE=medflow
JWT_SECRET=a7K9mP2xQ8vL5nB3wR6yT4jC1fG0hD9e
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_51SXqEk3ctFAsyNgPeWe...
STRIPE_WEBHOOK_SECRET=whsec_temporaire
```

⚠️ **IMPORTANT** : Remplacez par vos **vraies valeurs** :
- `DB_HOST` → Copié depuis Render PostgreSQL
- `DB_PASSWORD` → Copié depuis Render PostgreSQL (après "Reveal")
- `JWT_SECRET` → Généré avec la commande PowerShell
- `STRIPE_SECRET_KEY` → Copié depuis Stripe Dashboard

### Étape 4 : Ajouter dans Render

1. **Retourner** sur la page "New Web Service" de Render
2. **Scroller** jusqu'à "Environment Variables"
3. **Cliquer sur** "Add from .env"
4. **Coller** tout le contenu de votre fichier .env
5. **Cliquer sur** "Add Variables" ou "Parse"

Render va automatiquement créer toutes les variables !

Vous devriez voir apparaître une liste comme :
```
NODE_ENV          production
PORT              3002
DB_HOST           dpg-ct12abc34...
DB_PORT           5432
...
```

---

## ✅ Méthode A : Une par une (Alternative)

Si vous préférez ajouter une par une :

### Variable 1 : NODE_ENV

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `NODE_ENV`
3. **Value** : `production`
4. (Ne pas cliquer sur Generate)

### Variable 2 : PORT

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `PORT`
3. **Value** : `3002`

### Variable 3 : DB_HOST

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `DB_HOST`
3. **Value** : Aller chercher dans PostgreSQL → Info → Hostname
4. Exemple : `dpg-ct12abc34def56789-a.frankfurt-postgres.render.com`

### Variable 4 : DB_PORT

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `DB_PORT`
3. **Value** : `5432`

### Variable 5 : DB_USERNAME

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `DB_USERNAME`
3. **Value** : `medflow_user`

### Variable 6 : DB_PASSWORD

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `DB_PASSWORD`
3. **Value** : Aller dans PostgreSQL → Info → Password → Cliquer "Reveal" → Copier
4. ⚠️ **IMPORTANT** : Faire très attention à copier exactement le mot de passe

### Variable 7 : DB_DATABASE

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `DB_DATABASE`
3. **Value** : `medflow`

### Variable 8 : JWT_SECRET

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `JWT_SECRET`
3. **Value** : Générer avec PowerShell ou https://randomkeygen.com
4. Exemple : `a7K9mP2xQ8vL5nB3wR6yT4jC1fG0hD9e`

### Variable 9 : JWT_EXPIRES_IN

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `JWT_EXPIRES_IN`
3. **Value** : `1d`

### Variable 10 : FRONTEND_URL

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `FRONTEND_URL`
3. **Value** : `http://localhost:5173` (temporaire)

### Variable 11 : STRIPE_SECRET_KEY

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `STRIPE_SECRET_KEY`
3. **Value** : Aller sur Stripe Dashboard → Developers → API keys → Secret key → Reveal → Copier

### Variable 12 : STRIPE_WEBHOOK_SECRET

1. Cliquer sur **"Add Environment Variable"**
2. **Key** : `STRIPE_WEBHOOK_SECRET`
3. **Value** : `whsec_temporaire` (vous mettrez la vraie valeur plus tard)

---

## 🎯 Vérification finale

Avant de déployer, **vérifiez** que vous avez bien **12 variables** :

```
✅ NODE_ENV          = production
✅ PORT              = 3002
✅ DB_HOST           = dpg-xxxxx...render.com
✅ DB_PORT           = 5432
✅ DB_USERNAME       = medflow_user
✅ DB_PASSWORD       = [votre password]
✅ DB_DATABASE       = medflow
✅ JWT_SECRET        = [votre secret]
✅ JWT_EXPIRES_IN    = 1d
✅ FRONTEND_URL      = http://localhost:5173
✅ STRIPE_SECRET_KEY = sk_test_...
✅ STRIPE_WEBHOOK_SECRET = whsec_temporaire
```

---

## ⚠️ Erreurs courantes à éviter

### ❌ Erreur 1 : Oublier de remplacer les valeurs

**Mauvais** :
```env
DB_HOST=dpg-xxxxx-xxxx.frankfurt-postgres.render.com
DB_PASSWORD=VOTRE_PASSWORD_ICI
```

**Bon** :
```env
DB_HOST=dpg-ct12abc34def56789-a.frankfurt-postgres.render.com
DB_PASSWORD=xYz123AbC456DeF789GhI
```

### ❌ Erreur 2 : Copier avec des espaces

**Mauvais** :
```env
DB_PASSWORD = xYz123AbC456DeF789GhI
```

**Bon** :
```env
DB_PASSWORD=xYz123AbC456DeF789GhI
```

### ❌ Erreur 3 : Ne pas mettre les vraies valeurs Stripe

**Mauvais** :
```env
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_STRIPE_ICI
```

**Bon** (copier depuis Dashboard Stripe) :
```env
STRIPE_SECRET_KEY=sk_test_51XXX...VOTRE_VRAIE_CLE_STRIPE...XXX
```

### ❌ Erreur 4 : Oublier une variable

Si vous oubliez une variable, le backend **ne démarrera pas** !

Vérifiez bien que vous avez **les 12 variables**.

---

## 🚀 Une fois les variables ajoutées

1. **Scroller vers le bas** de la page
2. **Vérifier** une dernière fois :
   - Root Directory : `backend`
   - Language : `Docker`
   - Branch : `main`
   - Health Check Path : `/hello`
   - Toutes les variables sont présentes

3. **Cliquer sur "Deploy web service"**

4. **Attendre 5-10 minutes** que Render :
   - Clone votre repo
   - Build l'image Docker
   - Lance le conteneur
   - Vérifie le health check

5. **Aller dans "Logs"** pour voir le déploiement en temps réel

---

## 🎉 Succès !

Si vous voyez ce message dans les logs :
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [NestApplication] Application is running on: http://0.0.0.0:3002
```

**Félicitations !** Votre backend est déployé ! 🚀

---

## 📚 Besoin d'aide ?

Si vous avez un problème, vérifiez :

1. **Les logs de déploiement** dans Render
2. Que **toutes les 12 variables** sont présentes
3. Que **DB_PASSWORD** est correct (copié depuis PostgreSQL)
4. Que **STRIPE_SECRET_KEY** est correct (copié depuis Stripe)

**Erreur fréquente** : "Cannot connect to database"
→ Vérifier `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` sont corrects !
