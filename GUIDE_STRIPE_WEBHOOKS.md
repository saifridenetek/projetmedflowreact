# 🔔 Guide Complet : Configuration des Webhooks Stripe

## 📋 Qu'est-ce qu'un Webhook ?

Un webhook est une URL que Stripe appelle automatiquement quand un événement se produit (paiement réussi, échec, etc.). C'est comme une notification en temps réel.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Stripe    │         │   Backend   │
│  (Patient)  │         │             │         │  (Render)   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │  1. Paiement CB        │                        │
      │───────────────────────>│                        │
      │                        │                        │
      │                        │  2. Webhook Event      │
      │                        │───────────────────────>│
      │                        │  "Payment succeeded"   │
      │                        │                        │
      │                        │                        │  3. Confirmation
      │                        │                        │     en base de données
      │                        │                        │
      │  4. Confirmation       │                        │
      │<───────────────────────┴────────────────────────│
```

---

## 🎯 Étape 1 : Comprendre votre configuration actuelle

Vous devez récupérer vos clés Stripe depuis le Dashboard :
```env
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_DEPUIS_STRIPE_DASHBOARD
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_DEPUIS_STRIPE
```

⚠️ **ATTENTION** : Le `STRIPE_WEBHOOK_SECRET` actuel fonctionne pour le développement local (Stripe CLI). Pour la production (Render), vous devez créer un NOUVEAU webhook.

---

## 🚀 Étape 2 : Créer le Webhook sur Stripe (Production)

### 2.1 Accéder au Dashboard Stripe

1. Ouvrez votre navigateur
2. Allez sur https://dashboard.stripe.com
3. Connectez-vous avec votre compte Stripe

### 2.2 Naviguer vers les Webhooks

1. Dans le menu de gauche, cliquez sur **"Developers"** (Développeurs)
2. Cliquez sur **"Webhooks"**
3. Vous verrez peut-être déjà un webhook pour `localhost:3002` (celui du développement local)

### 2.3 Créer un nouveau Webhook pour Production

1. Cliquez sur **"Add endpoint"** (Ajouter un point de terminaison) en haut à droite

2. **Remplir l'URL du endpoint** :
   ```
   https://medflow-backend.onrender.com/payments/webhook
   ```
   
   ⚠️ **Remplacez** `medflow-backend` par le vrai nom de votre service Render :
   - Si votre service s'appelle `mon-medflow-api`, l'URL sera :
     ```
     https://mon-medflow-api.onrender.com/payments/webhook
     ```

3. **Optionnel : Description**
   ```
   MedFlow Production Webhook
   ```

4. **Sélectionner les événements** :
   
   Cliquez sur **"+ Select events"**
   
   Dans la recherche, trouvez et cochez :
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `invoice.payment_succeeded` (si vous utilisez des abonnements)
   
   Ou cliquez sur **"Select all events"** (tous les événements) pour être sûr.

5. **Cliquer sur "Add endpoint"**

---

## 🔑 Étape 3 : Récupérer le Signing Secret

### 3.1 Afficher le Secret

Après avoir créé le webhook, Stripe affiche la page du webhook.

1. Cherchez la section **"Signing secret"**
2. Cliquez sur **"Reveal"** ou le bouton 👁️ (œil)
3. Vous verrez une valeur qui commence par `whsec_...`

### 3.2 Copier le Secret

```
whsec_abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012
```

**Copiez cette valeur complète** (Ctrl+C)

---

## ⚙️ Étape 4 : Configurer Render avec le Nouveau Secret

### 4.1 Accéder à votre Backend sur Render

1. Allez sur https://dashboard.render.com
2. Cliquez sur votre service backend (ex: `medflow-backend`)

### 4.2 Ajouter/Modifier la Variable d'Environnement

1. Dans le menu de gauche, cliquez sur **"Environment"**

2. Cherchez la variable `STRIPE_WEBHOOK_SECRET`
   - **Si elle existe** : Cliquez sur le crayon ✏️ pour éditer
   - **Si elle n'existe pas** : Cliquez sur **"Add Environment Variable"**

3. Remplissez :
   ```
   Key: STRIPE_WEBHOOK_SECRET
   Value: whsec_abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012
   ```
   (Collez votre vraie valeur)

4. Cliquez sur **"Save Changes"**

### 4.3 Attendre le Redémarrage

Render redémarre automatiquement votre service. Attendez 1-2 minutes.

---

## 🧪 Étape 5 : Tester le Webhook

### Méthode 1 : Test depuis Stripe Dashboard (RECOMMANDÉ)

1. Sur la page du webhook dans Stripe Dashboard
2. Cliquez sur **"Send test webhook"** en haut à droite
3. Sélectionnez `checkout.session.completed`
4. Cliquez sur **"Send test event"**

**Résultat attendu** :
- Dans Stripe : Status `succeeded` avec un code HTTP 200
- Dans Render Logs : Message `"Webhook received: checkout.session.completed"`

### Méthode 2 : Faire un vrai paiement test

1. Allez sur votre application déployée sur Vercel
2. Créez un rendez-vous
3. Allez à la page de paiement
4. Utilisez une carte de test Stripe :
   ```
   Numéro : 4242 4242 4242 4242
   Date : N'importe quelle date future (ex: 12/25)
   CVC : N'importe quel 3 chiffres (ex: 123)
   ```
5. Validez le paiement

**Résultat attendu** :
- Le paiement est confirmé
- Dans Render Logs : `"Payment confirmed for appointment ID: xxx"`
- Dans votre base de données : Le rendez-vous passe à `status: 'confirmed'`

### Méthode 3 : Avec Stripe CLI (Développeurs)

```powershell
# Installer Stripe CLI
scoop install stripe

# Écouter les événements et les transférer vers Render
stripe listen --forward-to https://medflow-backend.onrender.com/payments/webhook

# Dans un autre terminal, déclencher un événement test
stripe trigger checkout.session.completed
```

---

## 📊 Étape 6 : Vérifier les Logs

### Sur Stripe Dashboard

1. **Developers** → **Webhooks**
2. Cliquez sur votre webhook de production
3. Descendez à **"Event log"**
4. Vous verrez tous les événements envoyés avec leur status :
   - ✅ `succeeded` (200) = Fonctionne parfaitement
   - ❌ `failed` (500/401/404) = Erreur à corriger

### Sur Render Dashboard

1. Sélectionnez votre service backend
2. Cliquez sur **"Logs"** dans le menu
3. Cherchez les messages :
   ```
   [Nest] INFO [PaymentsService] Webhook received: checkout.session.completed
   [Nest] INFO [PaymentsService] Payment confirmed for appointment ID: 123
   ```

---

## 🚨 Dépannage (Troubleshooting)

### Erreur : "No signatures found matching the expected signature"

**Cause** : Le `STRIPE_WEBHOOK_SECRET` est incorrect ou non défini.

**Solution** :
1. Vérifiez que vous avez copié le bon secret depuis Stripe
2. Vérifiez qu'il n'y a pas d'espaces avant/après dans Render
3. Redémarrez le service Render manuellement

### Erreur : "Webhook timeout" (504)

**Cause** : Le service Render est en veille (plan gratuit).

**Solution** :
1. Ouvrez l'URL de votre backend dans le navigateur : `https://medflow-backend.onrender.com/hello`
2. Attendez 30-60 secondes que le service démarre
3. Réessayez le webhook

### Erreur : "URL not found" (404)

**Cause** : L'URL du webhook est incorrecte.

**Solution** :
1. Vérifiez que l'URL est exactement : `https://VOTRE-SERVICE.onrender.com/payments/webhook`
2. Vérifiez que la route `/payments/webhook` existe dans votre backend
3. Vérifiez les logs Render pour voir si la requête arrive

### Pas d'événements reçus

**Causes possibles** :
1. Le webhook n'est pas activé sur Stripe
2. Le service Render est arrêté
3. Les événements sélectionnés ne correspondent pas

**Solution** :
1. Vérifiez que le webhook est activé (switch ON dans Stripe Dashboard)
2. Envoyez un test depuis Stripe Dashboard
3. Vérifiez les logs Render en temps réel

---

## 📝 Résumé de la Configuration

### Pour le Développement Local (localhost)

```env
# backend/.env
STRIPE_WEBHOOK_SECRET=whsec_cbb4f4a701423be74c27d3f1e3edbeb6a75d252034f9c42299a08fbc8acff544

# Commande pour tester
stripe listen --forward-to http://localhost:3002/payments/webhook
```

### Pour la Production (Render)

```env
# Render Dashboard → Environment Variables
STRIPE_WEBHOOK_SECRET=whsec_NOUVEAU_SECRET_DEPUIS_STRIPE_DASHBOARD

# URL du webhook sur Stripe
https://medflow-backend.onrender.com/payments/webhook
```

---

## ✅ Checklist Finale

- [ ] Webhook créé sur Stripe Dashboard
- [ ] URL du webhook : `https://VOTRE-SERVICE.onrender.com/payments/webhook`
- [ ] Événements sélectionnés : `checkout.session.completed`, `payment_intent.succeeded`
- [ ] Signing secret copié depuis Stripe
- [ ] Variable `STRIPE_WEBHOOK_SECRET` ajoutée dans Render
- [ ] Service Render redémarré
- [ ] Test webhook envoyé depuis Stripe = Status `succeeded`
- [ ] Logs Render montrent `"Webhook received"`
- [ ] Test de paiement avec carte 4242... = Paiement confirmé

---

## 🎉 C'est terminé !

Votre système de webhooks Stripe est maintenant configuré ! Les paiements seront automatiquement confirmés en temps réel. 🚀

**Questions fréquentes** :

**Q : Dois-je avoir 2 webhooks différents (local + production) ?**
R : Oui ! Un pour le développement (localhost avec Stripe CLI) et un pour la production (Render).

**Q : Puis-je utiliser le même secret pour les deux ?**
R : Non, chaque webhook a son propre secret unique.

**Q : Que se passe-t-il si le webhook échoue ?**
R : Stripe réessaie automatiquement pendant 3 jours. Vous pouvez aussi renvoyer manuellement depuis le Dashboard.

**Q : Comment voir l'historique des paiements ?**
R : Dashboard Stripe → Payments → Voir tous les paiements avec leur status.
