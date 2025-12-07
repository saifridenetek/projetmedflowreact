# Test d'isolation des cliniques (Tenant Isolation)

## 🎯 Objectif
Vérifier que les utilisateurs d'une clinique ne voient que les utilisateurs de leur propre clinique.

## 📋 Scénario de test

### Données de test (d'après votre screenshot)
- **Clinique 1** (tenantId: `clinic_cdf5ff21-05de-4565-bced-16e6be23af2c`)
  - rec rec (réceptionniste)
  - med med (médecin)

- **Clinique 2** (tenantId: `clinic_1949bae9-d08e-490e-a25a-b2a6de8d8360`)
  - rec1 rec1 (réceptionniste)
  - med1 med1 (médecin)

### Test 1: Connexion en tant que rec rec (Clinique 1)
1. Se connecter avec: `rec@rec.com` / mot de passe
2. Aller dans la section "Rendez-vous" → "Créer un RDV"
3. Dans la liste des médecins, vous devez voir:
   - ✅ **med med** (même clinique)
   - ❌ **med1 med1** (clinique différente - NE DOIT PAS APPARAITRE)

### Test 2: Connexion en tant que rec1 rec1 (Clinique 2)
1. Se connecter avec: `rec1@rec1.com` / mot de passe
2. Aller dans la section "Rendez-vous" → "Créer un RDV"
3. Dans la liste des médecins, vous devez voir:
   - ✅ **med1 med1** (même clinique)
   - ❌ **med med** (clinique différente - NE DOIT PAS APPARAITRE)

### Test 3: Connexion en tant qu'admin
1. Se connecter en tant qu'admin
2. Dans la section "Utilisateurs", vous devez voir:
   - ✅ **TOUS les utilisateurs** (admin voit tout)

## 🔧 Modifications apportées

### Backend (`backend/src/auth/auth.controller.ts`)
```typescript
@UseGuards(JwtAuthGuard)
@Get('users')
async getAllUsers(@Request() req) {
  const currentUser = await this.authService.findUserById(req.user.id);
  
  // Admin voit tous les utilisateurs
  if (req.user.role === 'admin') {
    return this.authService.getAllUsers();
  }
  
  // Pour les autres rôles (doctor, receptionist):
  // - Les staff de la même clinique (doctors, receptionists avec même tenantId)
  // - TOUS les patients (les patients ne sont pas limités à une clinique)
  if (currentUser && currentUser.tenantId) {
    return this.authService.getUsersForClinicStaff(currentUser.tenantId);
  }
  
  // Si pas de tenantId, retourner seulement les patients
  return this.authService.getUsersByRole('patient');
}
```

### Backend (`backend/src/auth/auth.service.ts`)
Ajout de 3 nouvelles méthodes:

```typescript
async getUsersForClinicStaff(tenantId: string): Promise<User[]> {
  // Retourne:
  // 1. Les médecins et réceptionnistes de la même clinique (même tenantId)
  // 2. TOUS les patients (peu importe leur tenantId)
  const staffUsers = await this.userRepository.find({
    where: { tenantId }
  });
  
  const patients = await this.userRepository.find({
    where: { role: 'patient' }
  });
  
  const allUsers = [...staffUsers, ...patients];
  
  return allUsers.map(user => {
    const { password, ...result } = user;
    return result as User;
  });
}

async getUsersByTenantId(tenantId: string): Promise<User[]> {
  const users = await this.userRepository.find({
    where: { tenantId }
  });
  return users.map(user => {
    const { password, ...result } = user;
    return result as User;
  });
}

async findUserById(userId: number): Promise<User | null> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  return user;
}
```

## ✅ Résultat attendu
- Les réceptionnistes ne voient que les médecins/réceptionnistes de leur clinique
- Les réceptionnistes voient **TOUS les patients** (peu importe la clinique)
- Les médecins ne voient que les médecins/réceptionnistes de leur clinique
- Les médecins voient **TOUS les patients** (peu importe la clinique)
- Les admins voient tous les utilisateurs

**Règle importante:** Les patients ne sont PAS limités par clinique car ils peuvent consulter dans n'importe quelle clinique.

## 🐛 Si ça ne marche pas
1. Vérifier que le backend a bien redémarré
2. Vider le cache du navigateur (Ctrl + Shift + R)
3. Se déconnecter et reconnecter
4. Vérifier dans la console browser (F12) les données retournées par `/auth/users`
5. Vérifier que les utilisateurs ont bien un `tenantId` dans la base de données

## 📊 Vérification en base de données
```sql
-- Voir les utilisateurs avec leur clinique
SELECT id, email, "firstName", "lastName", role, "tenantId", "clinicId"
FROM "user"
ORDER BY "tenantId", role;
```

## 🎉 Test réussi si:
- ✅ rec rec voit seulement med med (médecins de sa clinique)
- ✅ rec rec voit TOUS les patients
- ✅ rec1 rec1 voit seulement med1 med1 (médecins de sa clinique)
- ✅ rec1 rec1 voit TOUS les patients
- ✅ admin voit tout le monde
- ✅ Aucune erreur dans la console

**Important:** Les patients doivent être visibles par tous les staff (médecins et réceptionnistes) car un patient peut prendre rendez-vous dans n'importe quelle clinique.
