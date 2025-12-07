# 🔧 Guide de Résolution - Gestion des Cliniques et Modification des Utilisateurs

## ✅ Problèmes Résolus

### 1. **Modification d'utilisateurs** ❌ → ✅
- **Problème** : Le bouton "Modifier" ne faisait rien, toast vide
- **Solution** : 
  - Ajout de la fonction `handleEditUser()` dans Admin.jsx
  - Ajout de la fonction `handleUpdateUser()` dans Admin.jsx
  - Ajout du modal de modification avec tous les champs
  - Ajout de l'endpoint `PUT /admin/users/:id` dans le backend
  - Ajout de la méthode `updateUser()` dans AuthService

### 2. **Suppression d'utilisateurs** ❌ → ✅
- **Problème** : Le bouton "Supprimer" ne faisait rien
- **Solution** :
  - Ajout de la fonction `handleDeleteUser()` avec confirmation
  - Liaison du bouton avec la fonction onClick

### 3. **Section Gestion des Cliniques** (déjà implémentée ✅)
- La section existe déjà dans le menu
- Le bouton "🏥 Gestion cliniques" est présent dans la sidebar

---

## 🔍 Comment Tester

### Étape 1 : Vérifier que vous êtes connecté en tant qu'Admin

1. Ouvrez la console du navigateur (F12)
2. Tapez :
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Rôle:', payload.role);
```
3. Vous devriez voir `Rôle: admin`

### Étape 2 : Tester l'API des Cliniques

Dans la console du navigateur, copiez-collez le contenu du fichier `test-clinics-api.js` ou tapez :

```javascript
const token = localStorage.getItem('token');

// Test récupération des cliniques
fetch('http://localhost:3002/clinics', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Cliniques:', data))
.catch(err => console.error('Erreur:', err));
```

### Étape 3 : Tester la Modification d'Utilisateur

1. Allez dans **"👥 Gestion utilisateurs"**
2. Cliquez sur le bouton **"Modifier"** d'un utilisateur
3. Le modal de modification s'ouvre avec les données pré-remplies
4. Modifiez les champs (par exemple, changez le prénom)
5. Cliquez sur **"Modifier l'utilisateur"**
6. ✅ Vous devriez voir : "Utilisateur modifié avec succès"

**Note** : 
- L'email ne peut PAS être modifié (champ désactivé)
- Le mot de passe est optionnel (laisser vide = pas de changement)
- Les champs spécifiques au rôle s'affichent automatiquement

### Étape 4 : Tester la Suppression d'Utilisateur

1. Cliquez sur le bouton **"Supprimer"** d'un utilisateur
2. Une confirmation s'affiche : "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
3. Cliquez sur **OK**
4. ✅ Vous devriez voir : "Utilisateur supprimé avec succès"

**Note** : Impossible de supprimer le dernier admin

### Étape 5 : Tester la Gestion des Cliniques

1. Cliquez sur **"🏥 Gestion cliniques"** dans le menu de gauche
2. Vous devriez voir :
   - Le titre "Gestion des cliniques"
   - Le bouton "+ Créer une clinique"
   - La liste des cliniques (vide au départ)

3. **Créer une clinique** :
   - Cliquez sur "+ Créer une clinique"
   - Remplissez le formulaire :
     ```
     Nom: Clinique Centre-Ville
     Adresse: 123 Rue de la Santé, Paris
     Téléphone: 01 23 45 67 89
     Email: contact@clinique-centre.com
     ```
   - Cliquez sur "Créer la clinique"
   - ✅ La clinique apparaît avec son tenantId unique

4. **Affecter un utilisateur** :
   - Sur une carte de clinique, cliquez "Affecter un utilisateur"
   - Sélectionnez un médecin ou réceptionniste
   - Cliquez "Affecter"
   - ✅ L'utilisateur apparaît dans la liste de la clinique

---

## 🐛 Dépannage

### Problème : "Ne voit pas la section Gestion cliniques"

**Solution 1 : Vérifier le rôle**
```javascript
// Dans la console du navigateur (F12)
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Rôle:', payload.role); // Doit afficher "admin"
```

Si le rôle n'est pas "admin", connectez-vous avec un compte admin ou mettez à jour le rôle dans la base de données :
```sql
UPDATE users SET role = 'admin' WHERE email = 'samir@gmail.com';
```

**Solution 2 : Vérifier que le backend est démarré**
```bash
# Dans un terminal
cd backend
npm run start:dev
```

Vous devriez voir :
```
[Nest] ... LOG [RouterExplorer] Mapped {/clinics, GET} route
[Nest] ... LOG [RouterExplorer] Mapped {/clinics, POST} route
```

**Solution 3 : Vérifier les erreurs dans la console**
- Ouvrez F12 → Console
- Regardez s'il y a des erreurs rouges
- Erreurs CORS ? → Vérifiez que le backend autorise localhost:5173
- Erreur 401 ? → Token invalide, reconnectez-vous

### Problème : "Erreur 403 Forbidden"

Cela signifie que l'utilisateur n'est pas admin.

**Solution** :
```sql
-- Dans pgAdmin, exécutez :
UPDATE users SET role = 'admin' WHERE email = 'samir@gmail.com';
```

Puis déconnectez-vous et reconnectez-vous.

### Problème : "Liste des cliniques vide"

C'est normal si aucune clinique n'a été créée. Créez votre première clinique !

---

## 📋 Checklist Complète

- [ ] Backend démarré sur port 3002
- [ ] Frontend démarré sur port 5173
- [ ] Connecté avec un compte admin (rôle = 'admin')
- [ ] Menu "🏥 Gestion cliniques" visible
- [ ] Bouton "+ Créer une clinique" visible
- [ ] Modification d'utilisateur fonctionne
- [ ] Suppression d'utilisateur fonctionne (avec confirmation)
- [ ] Création de clinique fonctionne
- [ ] Affectation d'utilisateur à une clinique fonctionne

---

## 🎯 Workflow Complet

### 1. Créer les Cliniques
```
Admin → Gestion cliniques → + Créer une clinique
→ Clinique 1: "Clinique Paris Centre"
→ Clinique 2: "Clinique Marseille Nord"
→ Clinique 3: "Clinique Lyon Sud"
```

### 2. Créer les Utilisateurs
```
Admin → Gestion utilisateurs → + Ajouter un utilisateur
→ Dr. Martin (doctor, Cardiologue)
→ Dr. Dupont (doctor, Dermatologue)
→ Marie Recep (receptionist)
→ Sophie Admin (receptionist)
```

### 3. Affecter les Utilisateurs
```
Admin → Gestion cliniques → Clinique 1 → Affecter un utilisateur
→ Affecter Dr. Martin
→ Affecter Marie Recep

Admin → Gestion cliniques → Clinique 2 → Affecter un utilisateur
→ Affecter Dr. Dupont
→ Affecter Sophie Admin
```

### 4. Vérifier l'Isolation
```
Chaque utilisateur affecté reçoit le tenantId de sa clinique
→ Dr. Martin.tenantId = "clinic_xxx" (Clinique 1)
→ Dr. Dupont.tenantId = "clinic_yyy" (Clinique 2)
```

---

## 🔒 Sécurité

- ✅ Tous les endpoints cliniques sont protégés par `@Roles('admin')`
- ✅ Impossible de modifier l'email d'un utilisateur
- ✅ Impossible de supprimer le dernier admin
- ✅ Les mots de passe sont hashés avec bcrypt
- ✅ Chaque clinique a un tenantId unique (UUID v4)

---

## 📞 Support

Si vous rencontrez toujours des problèmes :

1. **Vérifiez les logs du backend** dans le terminal
2. **Vérifiez la console du navigateur** (F12)
3. **Testez l'API manuellement** avec le fichier `test-clinics-api.js`
4. **Vérifiez la base de données** dans pgAdmin

---

✅ **Tout devrait fonctionner maintenant !** 🎉
