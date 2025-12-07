# 💳 Guide complet : Paiement avec Stripe

## 🎯 Prérequis
- Backend démarré sur `http://localhost:3002`
- Frontend démarré sur `http://localhost:5173`
- Stripe CLI installé
- Compte Stripe (mode test)

---

## 📋 Étapes pour tester un paiement

### **Étape 1: Vérifier que le backend tourne**

Ouvrir un terminal PowerShell et exécuter :
```powershell
cd "c:\Users\tayma store\Desktop\ProjectReactMedFlow\backend"
npm run start:dev
```

Le backend doit afficher : `Backend démarré sur http://localhost:3002`

---

### **Étape 2: Vérifier que le frontend tourne**

Ouvrir un **NOUVEAU** terminal PowerShell et exécuter :
```powershell
cd "c:\Users\tayma store\Desktop\ProjectReactMedFlow\frontend"
npm run dev
```

Le frontend doit afficher : `Local: http://localhost:5173/`

---

### **Étape 3: Démarrer Stripe CLI (IMPORTANT !)**

Ouvrir un **TROISIÈME** terminal PowerShell et exécuter :
```powershell
stripe listen --forward-to localhost:3002/payments/webhook
```

✅ **Vous devez voir :**
```
> Ready! You are using Stripe API Version [2025-11-17.clover]. 
Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

⚠️ **IMPORTANT :** 
- Ce terminal doit rester **OUVERT** pendant tout le processus de paiement
- Stripe CLI écoute les événements de paiement et les transmet à votre backend local
- Si vous fermez ce terminal, les paiements ne seront pas confirmés

---

### **Étape 4: Créer une facture dans l'application**

1. Connectez-vous en tant que **patient** sur `http://localhost:5173`
2. Allez dans **"Rendez-vous"** ou **"Mes consultations"**
3. Trouvez une consultation **non payée**
4. Cliquez sur le bouton **"💳 Payer maintenant"**

---

### **Étape 5: Payer avec Stripe (mode test)**

Une page Stripe Checkout s'ouvre. Utilisez ces **cartes de test** :

#### ✅ **Carte qui réussit toujours :**
```
Numéro : 4242 4242 4242 4242
Date : 12/34 (n'importe quelle date future)
CVC : 123 (n'importe quel 3 chiffres)
```

#### ❌ **Carte qui échoue toujours :**
```
Numéro : 4000 0000 0000 0002
Date : 12/34
CVC : 123
```

#### 🔐 **Carte qui nécessite une authentification 3D Secure :**
```
Numéro : 4000 0025 0000 3155
Date : 12/34
CVC : 123
```

---

### **Étape 6: Vérifier que le paiement a fonctionné**

#### Dans le terminal Stripe CLI, vous devez voir :
```
2025-12-07 12:30:15 --> checkout.session.completed [evt_xxxxx]
2025-12-07 12:30:15 <-- [200] POST http://localhost:3002/payments/webhook [evt_xxxxx]
```

#### Dans l'application :
1. Vous êtes redirigé vers une page de **succès**
2. La facture est maintenant marquée **"Payé ✅"**
3. Un enregistrement de paiement est créé dans la base de données

---

## 🔍 Vérification dans la base de données

Vous pouvez vérifier le paiement en SQL :

```sql
SELECT 
    p.id, 
    p.amount, 
    p.status,
    p."stripeSessionId",
    c.diagnostic,
    u."firstName" || ' ' || u."lastName" as patient_name
FROM payment p
JOIN consultation c ON p."consultationId" = c.id
JOIN "user" u ON c."patient_id" = u.id
ORDER BY p."createdAt" DESC;
```

---

## 📊 Tableau récapitulatif des états

| État | Description | Affichage dans l'UI |
|------|-------------|---------------------|
| `pending` | Paiement en cours | 🕐 En attente |
| `completed` | Paiement réussi | ✅ Payé |
| `failed` | Paiement échoué | ❌ Échec |

---

## ❌ Problèmes fréquents et solutions

### **Problème 1: "Webhook endpoint returned an error"**
**Cause :** Le backend n'est pas démarré ou l'URL webhook est incorrecte

**Solution :**
```powershell
# Arrêter Stripe CLI (Ctrl+C)
# Vérifier que le backend tourne
curl http://localhost:3002/hello

# Redémarrer Stripe CLI
stripe listen --forward-to localhost:3002/payments/webhook
```

---

### **Problème 2: Le paiement est marqué "pending" mais ne passe jamais à "completed"**
**Cause :** Stripe CLI n'est pas en cours d'exécution

**Solution :**
- Vérifier qu'un terminal avec `stripe listen` est ouvert
- Redémarrer Stripe CLI si nécessaire

---

### **Problème 3: "Error: No such checkout session"**
**Cause :** La session Stripe a expiré (après 24h)

**Solution :**
- Créer une nouvelle session de paiement
- Cliquer à nouveau sur "Payer maintenant"

---

### **Problème 4: Le webhook ne reçoit rien**
**Cause :** Port incorrect ou backend pas accessible

**Solution :**
```powershell
# Vérifier que le backend écoute sur 3002
netstat -ano | findstr :3002

# Vérifier l'endpoint webhook
curl http://localhost:3002/payments/webhook
```

---

## 🎓 Comprendre le flux de paiement

```
1. Patient clique "Payer" 
   ↓
2. Frontend appelle POST /payments/create-session
   ↓
3. Backend crée une session Stripe et retourne l'URL
   ↓
4. Frontend redirige vers Stripe Checkout
   ↓
5. Patient entre sa carte et confirme
   ↓
6. Stripe envoie un webhook à localhost:3002/payments/webhook
   ↓ (via Stripe CLI)
7. Backend met à jour le statut du paiement à "completed"
   ↓
8. Patient est redirigé vers la page de succès
```

---

## 🔑 Commandes utiles

### Voir les événements Stripe en temps réel
```powershell
stripe listen --forward-to localhost:3002/payments/webhook
```

### Tester un webhook manuellement
```powershell
stripe trigger checkout.session.completed
```

### Voir les logs Stripe
```powershell
stripe logs tail
```

### Lister les sessions Stripe
```powershell
stripe checkout sessions list --limit 10
```

---

## 🎉 Résumé rapide

Pour tester un paiement, vous avez besoin de **3 terminaux ouverts** :

1. **Terminal 1 (Backend)** : `npm run start:dev` dans `/backend`
2. **Terminal 2 (Frontend)** : `npm run dev` dans `/frontend`
3. **Terminal 3 (Stripe CLI)** : `stripe listen --forward-to localhost:3002/payments/webhook`

Puis dans l'application web :
- Connectez-vous en tant que patient
- Cliquez sur "Payer maintenant"
- Utilisez la carte `4242 4242 4242 4242`
- Vérifiez que le terminal Stripe CLI affiche le webhook reçu

✅ **Paiement réussi !**

---

## 📞 Besoin d'aide ?

- Documentation Stripe : https://stripe.com/docs/testing
- Cartes de test : https://stripe.com/docs/testing#cards
- Stripe CLI : https://stripe.com/docs/stripe-cli
