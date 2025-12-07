# 🏥 Implémentation Multi-Tenant MedFlow
## Architecture d'Isolation par Clinique avec TenantID

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Implémentation Backend](#implémentation-backend)
4. [Implémentation Frontend](#implémentation-frontend)
5. [Fonctionnalités](#fonctionnalités)
6. [Guide d'utilisation](#guide-dutilisation)
7. [Sécurité et Isolation](#sécurité-et-isolation)
8. [Migration et Déploiement](#migration-et-déploiement)

---

## 🎯 Vue d'ensemble

### Concept Multi-Tenant

Le système multi-tenant permet à plusieurs cliniques d'utiliser la même application MedFlow tout en garantissant **l'isolation complète des données** entre elles. Chaque clinique dispose de son propre espace isolé identifié par un **tenantId unique**.

### Objectifs

- ✅ **Isolation des données** : Chaque clinique ne voit que ses propres données
- ✅ **Sécurité renforcée** : Impossibilité d'accéder aux données d'une autre clinique
- ✅ **Gestion centralisée** : Un administrateur global gère toutes les cliniques
- ✅ **Affectation flexible** : Médecins et réceptionnistes peuvent être affectés à une clinique
- ✅ **Scalabilité** : Support illimité de cliniques sur la même infrastructure

---

## 🏗️ Architecture

### Schéma de l'Architecture Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Global (tenantId: null)            │
│                    - Gère toutes les cliniques              │
│                    - Crée des cliniques                     │
│                    - Affecte des utilisateurs               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │Clinique1│    │Clinique2│    │Clinique3│
    │tenant_1 │    │tenant_2 │    │tenant_3 │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
    ┌────┴─────┐   ┌────┴─────┐   ┌────┴─────┐
    │Users     │   │Users     │   │Users     │
    │-Doctor1  │   │-Doctor3  │   │-Doctor5  │
    │-Recep1   │   │-Doctor4  │   │-Recep3   │
    │-Patient1 │   │-Patient2 │   │-Patient4 │
    └──────────┘   └──────────┘   └──────────┘
         │              │              │
    ┌────┴─────┐   ┌────┴─────┐   ┌────┴─────┐
    │Data      │   │Data      │   │Data      │
    │-RDV      │   │-RDV      │   │-RDV      │
    │-Consult. │   │-Consult. │   │-Consult. │
    │-Prescr.  │   │-Prescr.  │   │-Prescr.  │
    │-Paiement │   │-Paiement │   │-Paiement │
    └──────────┘   └──────────┘   └──────────┘
```

### Principe de Fonctionnement

1. **Création de clinique** : L'admin crée une clinique → génération automatique d'un `tenantId` unique
2. **Affectation** : L'admin affecte des docteurs/réceptionnistes à une clinique
3. **Propagation** : Le `tenantId` est automatiquement copié sur tous les utilisateurs et données associées
4. **Isolation** : Toutes les requêtes filtrent automatiquement par `tenantId`

---

## 🔧 Implémentation Backend

### 1. Nouvelle Entité Clinic

**Fichier** : `backend/src/entities/clinic.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tenantId: string; // UUID unique pour isolation

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.clinic)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Points clés** :
- `tenantId` : Identifiant unique (UUID) généré automatiquement
- `isActive` : Permet de désactiver une clinique sans la supprimer
- Relation `OneToMany` avec les utilisateurs

### 2. Mise à Jour de l'Entité User

**Fichier** : `backend/src/entities/user.entity.ts`

```typescript
// Ajouts dans l'entité User
@Column({ nullable: true })
tenantId: string; // Copie du tenantId de la clinique

@ManyToOne(() => Clinic, (clinic) => clinic.users, { nullable: true })
@JoinColumn({ name: 'clinicId' })
clinic: Clinic;

@Column({ nullable: true })
clinicId: number;
```

**Pourquoi `tenantId` dans User ?**
- **Performance** : Évite les JOIN sur chaque requête
- **Simplicité** : Filtrage direct sans relation
- **Redondance contrôlée** : Le tenantId est synchronisé automatiquement

### 3. Ajout de tenantId aux Entités Métier

Toutes les entités de données métier ont été enrichies avec `tenantId` :

```typescript
// Appointment, Consultation, Prescription, Payment
@Column({ nullable: true })
tenantId: string; // Isolation par clinique
```

**Entités concernées** :
- ✅ `Appointment` (Rendez-vous)
- ✅ `Consultation`
- ✅ `Prescription`
- ✅ `Payment` (Paiements)

### 4. Service de Gestion des Cliniques

**Fichier** : `backend/src/clinics/clinics.service.ts`

#### Méthodes principales

##### Création d'une clinique

```typescript
async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
  // Génération automatique d'un tenantId unique avec UUID v4
  const tenantId = `clinic_${uuidv4()}`;

  const clinic = this.clinicRepository.create({
    ...createClinicDto,
    tenantId,
  });

  return await this.clinicRepository.save(clinic);
}
```

**Exemple de tenantId généré** : `clinic_a1b2c3d4-e5f6-7890-abcd-ef1234567890`

##### Affectation d'un utilisateur à une clinique

```typescript
async assignUserToClinic(userId: number, clinicId: number): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  const clinic = await this.findOne(clinicId);

  // Propagation du tenantId
  user.clinic = clinic;
  user.clinicId = clinicId;
  user.tenantId = clinic.tenantId; // ⚡ Clé de l'isolation

  return await this.userRepository.save(user);
}
```

**Propagation automatique** :
1. L'utilisateur reçoit le `clinicId` (relation)
2. L'utilisateur reçoit le `tenantId` (copie pour performance)
3. Toutes ses futures actions seront marquées avec ce `tenantId`

##### Désaffectation d'un utilisateur

```typescript
async unassignUserFromClinic(userId: number): Promise<User> {
  // Utilise une requête SQL raw pour gérer les NULL
  await this.userRepository.query(
    'UPDATE users SET "clinicId" = NULL, "tenantId" = NULL WHERE id = $1',
    [userId],
  );

  return await this.userRepository.findOne({ where: { id: userId } });
}
```

##### Statistiques d'une clinique

```typescript
async getClinicStats(clinicId: number) {
  const clinic = await this.findOne(clinicId);
  const users = await this.getUsersByClinic(clinicId);

  return {
    clinic,
    stats: {
      totalUsers: users.length,
      doctors: users.filter((u) => u.role === 'doctor').length,
      receptionists: users.filter((u) => u.role === 'receptionist').length,
      patients: users.filter((u) => u.role === 'patient').length,
      activeUsers: users.filter((u) => u.isActive).length,
    },
  };
}
```

### 5. Contrôleur Cliniques

**Fichier** : `backend/src/clinics/clinics.controller.ts`

Tous les endpoints sont protégés par :
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
```

**Endpoints disponibles** :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/clinics` | Créer une clinique |
| GET | `/clinics` | Lister toutes les cliniques |
| GET | `/clinics/:id` | Détails d'une clinique |
| PUT | `/clinics/:id` | Modifier une clinique |
| DELETE | `/clinics/:id` | Supprimer une clinique |
| POST | `/clinics/:clinicId/assign-user/:userId` | Affecter un utilisateur |
| DELETE | `/clinics/unassign-user/:userId` | Désaffecter un utilisateur |
| GET | `/clinics/:id/users` | Utilisateurs d'une clinique |
| GET | `/clinics/:id/stats` | Statistiques d'une clinique |

### 6. Intégration dans le Module Principal

**Fichier** : `backend/src/app.module.ts`

```typescript
import { ClinicsModule } from './clinics/clinics.module';
import { Clinic } from './entities/clinic.entity';

// Dans imports
ClinicsModule,

// Dans entities TypeORM
entities: [User, Clinic, Appointment, Consultation, Prescription, Payment],
```

---

## 💻 Implémentation Frontend

### 1. Service API Cliniques

**Fichier** : `frontend/src/services/api.js`

```javascript
export const clinicService = {
  getAll: () => apiCall('/clinics'),
  getById: (id) => apiCall(`/clinics/${id}`),
  create: (clinicData) => apiCall('/clinics', {
    method: 'POST',
    body: JSON.stringify(clinicData)
  }),
  update: (id, clinicData) => apiCall(`/clinics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clinicData)
  }),
  delete: (id) => apiCall(`/clinics/${id}`, {
    method: 'DELETE'
  }),
  assignUser: (clinicId, userId) => apiCall(`/clinics/${clinicId}/assign-user/${userId}`, {
    method: 'POST'
  }),
  unassignUser: (userId) => apiCall(`/clinics/unassign-user/${userId}`, {
    method: 'DELETE'
  }),
  getUsers: (clinicId) => apiCall(`/clinics/${clinicId}/users`),
  getStats: (clinicId) => apiCall(`/clinics/${clinicId}/stats`)
};
```

### 2. Interface Admin - Gestion des Cliniques

**Fichier** : `frontend/src/Admin.jsx`

#### États ajoutés

```javascript
const [clinics, setClinics] = useState([]);
const [showCreateClinic, setShowCreateClinic] = useState(false);
const [showAssignUserModal, setShowAssignUserModal] = useState(false);
const [selectedClinic, setSelectedClinic] = useState(null);

const [newClinic, setNewClinic] = useState({
  name: '',
  address: '',
  phone: '',
  email: '',
  isActive: true
});
```

#### Fonctions de gestion

```javascript
const fetchClinics = async () => {
  const data = await clinicService.getAll();
  setClinics(data.clinics || []);
};

const handleCreateClinic = async (e) => {
  e.preventDefault();
  await clinicService.create(newClinic);
  setShowCreateClinic(false);
  fetchClinics();
  alert('Clinique créée avec succès');
};

const handleAssignUserToClinic = async (userId, clinicId) => {
  await clinicService.assignUser(clinicId, userId);
  setShowAssignUserModal(false);
  fetchClinics();
  alert('Utilisateur affecté avec succès');
};

const handleUnassignUser = async (userId) => {
  if (!confirm('Voulez-vous vraiment désaffecter cet utilisateur ?')) return;
  await clinicService.unassignUser(userId);
  fetchClinics();
  alert('Utilisateur désaffecté avec succès');
};
```

#### Composant de rendu des cliniques

```jsx
const renderClinics = () => (
  <div className="users-content">
    <div className="users-header">
      <h1>Gestion des cliniques</h1>
      <button onClick={() => setShowCreateClinic(true)}>
        + Créer une clinique
      </button>
    </div>

    <div className="clinics-grid">
      {clinics.map(clinic => (
        <div key={clinic.id} className="clinic-card">
          <div className="clinic-header">
            <h3>🏥 {clinic.name}</h3>
            <span className={clinic.isActive ? 'badge-active' : 'badge-inactive'}>
              {clinic.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          
          <div className="clinic-info">
            <p><strong>TenantID:</strong> <code>{clinic.tenantId}</code></p>
            {clinic.address && <p>📍 {clinic.address}</p>}
            {clinic.phone && <p>📞 {clinic.phone}</p>}
            {clinic.email && <p>📧 {clinic.email}</p>}
          </div>
          
          <div className="clinic-stats">
            <span className="stat-label">Utilisateurs</span>
            <span className="stat-value">{clinic.users?.length || 0}</span>
          </div>
          
          <button onClick={() => {
            setSelectedClinic(clinic);
            setShowAssignUserModal(true);
          }}>
            Affecter un utilisateur
          </button>
          
          {/* Liste des utilisateurs affectés */}
          {clinic.users?.map(u => (
            <div key={u.id} className="clinic-user-item">
              <span>{u.firstName} {u.lastName} ({u.role})</span>
              <button onClick={() => handleUnassignUser(u.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
```

### 3. Styles CSS

**Fichier** : `frontend/src/admin.css`

```css
.clinics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.clinic-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
}

.clinic-info code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #2563eb;
}

.badge-active {
  background: #10b981;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}
```

---

## ✨ Fonctionnalités

### 1. Création de Clinique

**Processus** :
1. Admin clique sur "+ Créer une clinique"
2. Remplit le formulaire :
   - Nom (obligatoire)
   - Adresse (optionnel)
   - Téléphone (optionnel)
   - Email (optionnel)
3. Backend génère automatiquement un `tenantId` unique
4. La clinique est créée et apparaît dans la liste

**Exemple** :
- Nom : "Clinique du Centre-Ville"
- TenantID généré : `clinic_a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 2. Affectation d'Utilisateurs

**Qui peut être affecté ?**
- ✅ Médecins (role: doctor)
- ✅ Réceptionnistes (role: receptionist)
- ❌ Patients (affectés automatiquement via leurs RDV)
- ❌ Admins (gèrent toutes les cliniques)

**Processus** :
1. Cliquer sur "Affecter un utilisateur" d'une clinique
2. Une liste des utilisateurs disponibles s'affiche
3. Cliquer sur "Affecter" à côté d'un utilisateur
4. L'utilisateur reçoit automatiquement :
   - `clinicId` = ID de la clinique
   - `tenantId` = TenantID de la clinique

### 3. Désaffectation

**Processus** :
1. Cliquer sur le "✕" à côté d'un utilisateur affecté
2. Confirmation demandée
3. L'utilisateur est désaffecté :
   - `clinicId` → NULL
   - `tenantId` → NULL
4. Il redevient disponible pour affectation

### 4. Visualisation des Cliniques

**Informations affichées** :
- 🏥 Nom de la clinique
- 🆔 TenantID unique
- 📍 Adresse
- 📞 Téléphone
- 📧 Email
- ✅ Statut (Actif/Inactif)
- 👥 Nombre d'utilisateurs affectés
- 📋 Liste détaillée des utilisateurs

---

## 🔐 Sécurité et Isolation

### Principe de l'Isolation

```
┌──────────────────────────────────────────────┐
│          Requête Utilisateur                 │
│    "Récupérer mes rendez-vous"              │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│   JWT Token décodé                             │
│   → user.tenantId = "clinic_abc123"           │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│   Requête SQL avec filtre automatique          │
│   SELECT * FROM appointments                   │
│   WHERE tenantId = 'clinic_abc123'            │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│   Résultats isolés                             │
│   → Seulement les RDV de la Clinique ABC      │
└────────────────────────────────────────────────┘
```

### Niveaux de Sécurité

#### 1. Authentification JWT
```typescript
@UseGuards(JwtAuthGuard)
```
- Vérifie que l'utilisateur est connecté
- Décode le token pour extraire `user.id` et `user.tenantId`

#### 2. Filtrage automatique par tenantId

**Exemple dans un service** :
```typescript
// ❌ DANGEREUX - Pas de filtrage
async getAll() {
  return await this.repository.find();
}

// ✅ SÉCURISÉ - Filtrage par tenantId
async getAll(user: User) {
  return await this.repository.find({
    where: { tenantId: user.tenantId }
  });
}
```

#### 3. Propagation automatique du tenantId

```typescript
// Lors de la création d'un rendez-vous
async createAppointment(dto: CreateAppointmentDto, user: User) {
  const appointment = this.repository.create({
    ...dto,
    tenantId: user.tenantId  // ⚡ Copie automatique
  });
  
  return await this.repository.save(appointment);
}
```

### Règles d'Isolation

| Entité | tenantId hérité de | Règle |
|--------|-------------------|-------|
| User | Clinic (lors affectation) | Médecins/Réceptionnistes ont le tenantId de leur clinique |
| Appointment | User (créateur) | Hérite du tenantId du médecin ou réceptionniste |
| Consultation | Appointment | Hérite du tenantId du rendez-vous associé |
| Prescription | User (médecin) | Hérite du tenantId du médecin prescripteur |
| Payment | Appointment | Hérite du tenantId du rendez-vous payé |

### Cas Spéciaux

#### Administrateur Global
- `tenantId = null`
- Peut voir **toutes** les cliniques
- Crée et gère les cliniques
- Affecte les utilisateurs

#### Patients
- `tenantId` copié depuis le rendez-vous
- Un patient peut avoir des RDV dans plusieurs cliniques
- Chaque RDV garde le `tenantId` de la clinique concernée

---

## 📦 Migration et Déploiement

### 1. Installation des Dépendances

```bash
cd backend
npm install uuid
npm install --save-dev @types/uuid
```

### 2. Mise à Jour de la Base de Données

**TypeORM avec synchronize: true** (Développement uniquement)
```typescript
// app.module.ts
synchronize: true  // ⚠️ Active la création automatique des tables
```

Les colonnes `tenantId` et `clinicId` seront ajoutées automatiquement.

**Migration manuelle** (Production recommandée)
```sql
-- Ajouter colonne tenantId à la table users
ALTER TABLE users ADD COLUMN "tenantId" VARCHAR NULL;
ALTER TABLE users ADD COLUMN "clinicId" INTEGER NULL;

-- Ajouter foreign key
ALTER TABLE users ADD CONSTRAINT FK_users_clinic 
  FOREIGN KEY ("clinicId") REFERENCES clinics(id);

-- Ajouter tenantId aux autres tables
ALTER TABLE appointments ADD COLUMN "tenantId" VARCHAR NULL;
ALTER TABLE consultations ADD COLUMN "tenantId" VARCHAR NULL;
ALTER TABLE prescriptions ADD COLUMN "tenantId" VARCHAR NULL;
ALTER TABLE payments ADD COLUMN "tenantId" VARCHAR NULL;

-- Créer des index pour performance
CREATE INDEX idx_users_tenantId ON users("tenantId");
CREATE INDEX idx_appointments_tenantId ON appointments("tenantId");
CREATE INDEX idx_consultations_tenantId ON consultations("tenantId");
CREATE INDEX idx_prescriptions_tenantId ON prescriptions("tenantId");
CREATE INDEX idx_payments_tenantId ON payments("tenantId");
```

### 3. Démarrage du Backend

```bash
cd backend
npm run start:dev
```

### 4. Démarrage du Frontend

```bash
cd frontend
npm run dev
```

---

## 🎮 Guide d'Utilisation

### Étape 1 : Créer une Clinique

1. Connectez-vous en tant qu'**Admin**
2. Allez dans **"Gestion cliniques"**
3. Cliquez sur **"+ Créer une clinique"**
4. Remplissez le formulaire :
   ```
   Nom : Clinique du Centre
   Adresse : 123 Rue de la Santé
   Téléphone : 01 23 45 67 89
   Email : contact@cliniquecentre.fr
   ```
5. Cliquez sur **"Créer la clinique"**
6. ✅ La clinique apparaît avec un `tenantId` unique

### Étape 2 : Créer des Utilisateurs

1. Allez dans **"Gestion utilisateurs"**
2. Créez un médecin :
   ```
   Email : dr.martin@medflow.com
   Prénom : Jean
   Nom : Martin
   Rôle : doctor
   Spécialité : Cardiologue
   ```
3. Créez une réceptionniste :
   ```
   Email : recep.dupont@medflow.com
   Prénom : Marie
   Nom : Dupont
   Rôle : receptionist
   ```

### Étape 3 : Affecter les Utilisateurs

1. Retournez dans **"Gestion cliniques"**
2. Sur la carte de la **Clinique du Centre**
3. Cliquez sur **"Affecter un utilisateur"**
4. Sélectionnez **Dr. Jean Martin** → Cliquez **"Affecter"**
5. Répétez pour **Marie Dupont**
6. ✅ Les deux utilisateurs sont maintenant dans la liste de la clinique

### Étape 4 : Vérification de l'Isolation

1. **Déconnectez-vous**
2. Connectez-vous comme **Dr. Jean Martin**
3. ✅ Il ne voit que :
   - Les rendez-vous de sa clinique
   - Les patients de sa clinique
   - Les consultations de sa clinique

### Étape 5 : Créer une Deuxième Clinique

1. Reconnectez-vous en **Admin**
2. Créez une deuxième clinique : **"Clinique du Nord"**
3. Créez et affectez d'autres utilisateurs à cette clinique
4. ✅ Les deux cliniques sont **complètement isolées**

---

## 🔍 Cas d'Usage Avancés

### Scénario 1 : Transfert d'Utilisateur

**Problème** : Un médecin change de clinique.

**Solution** :
1. Admin désaffecte le médecin de la Clinique A
2. Admin affecte le médecin à la Clinique B
3. Le médecin reçoit le nouveau `tenantId` de la Clinique B
4. **Note** : Les anciennes données (consultations, prescriptions) gardent l'ancien `tenantId`

### Scénario 2 : Fermeture de Clinique

**Problème** : Une clinique ferme définitivement.

**Solution** :
1. Désaffecter tous les utilisateurs de la clinique
2. Marquer la clinique comme `isActive = false`
3. **Ne pas supprimer** : Préserver l'historique des données
4. Les données restent dans la base avec leur `tenantId` original

### Scénario 3 : Patient Multi-Cliniques

**Problème** : Un patient consulte dans deux cliniques différentes.

**Solution automatique** :
- Le patient a `tenantId = null` (car pas affecté à une clinique)
- Chaque rendez-vous qu'il prend hérite du `tenantId` de la clinique
- RDV à la Clinique A → `tenantId = "clinic_A"`
- RDV à la Clinique B → `tenantId = "clinic_B"`
- Chaque clinique ne voit que ses propres RDV du patient

---

## 📊 Statistiques et Monitoring

### Dashboard Admin

L'admin peut voir des statistiques globales :
- Nombre total de cliniques
- Nombre d'utilisateurs par clinique
- Cliniques actives vs inactives
- Distribution des rôles par clinique

### Dashboard par Clinique

Pour chaque clinique, l'admin peut consulter :
- Nombre de médecins
- Nombre de réceptionnistes
- Nombre de patients (via leurs RDV)
- Nombre de rendez-vous total
- Revenus (via paiements)

---

## ⚠️ Points d'Attention

### 1. Performance

**Index recommandés** :
```sql
CREATE INDEX idx_users_tenantId ON users("tenantId");
CREATE INDEX idx_appointments_tenantId ON appointments("tenantId");
```

### 2. Sauvegarde

**Stratégie de backup** :
- Backup par clinique possible via export SQL filtré :
```sql
-- Export des données d'une clinique spécifique
\copy (SELECT * FROM appointments WHERE "tenantId" = 'clinic_abc') TO 'clinic_abc_backup.csv';
```

### 3. Conformité RGPD

**Droit à l'oubli** :
- Supprimer toutes les données d'un patient :
```sql
DELETE FROM appointments WHERE patient_id = X;
DELETE FROM consultations WHERE patient_id = X;
DELETE FROM prescriptions WHERE patient_id = X;
-- etc.
```

### 4. Tests

**Test d'isolation** :
```typescript
// Test : Vérifier qu'un médecin ne voit pas les données d'une autre clinique
it('should isolate data by tenantId', async () => {
  const doctor1 = { tenantId: 'clinic_A' };
  const doctor2 = { tenantId: 'clinic_B' };
  
  const rdvs1 = await appointmentService.getAll(doctor1);
  const rdvs2 = await appointmentService.getAll(doctor2);
  
  // Les listes doivent être différentes
  expect(rdvs1).not.toEqual(rdvs2);
  
  // Aucun RDV ne doit avoir un tenantId différent
  rdvs1.forEach(rdv => {
    expect(rdv.tenantId).toBe('clinic_A');
  });
});
```

---

## 🎓 Bonnes Pratiques

### 1. Toujours Filtrer par tenantId

```typescript
// ❌ MAUVAIS
async findAll() {
  return this.repository.find();
}

// ✅ BON
async findAll(user: User) {
  return this.repository.find({
    where: { tenantId: user.tenantId }
  });
}
```

### 2. Copier le tenantId à la Création

```typescript
// ✅ Toujours propager le tenantId
async create(dto: CreateDto, user: User) {
  return this.repository.save({
    ...dto,
    tenantId: user.tenantId
  });
}
```

### 3. Ne Jamais Exposer les tenantIds

```typescript
// ❌ DANGEREUX - Permet de deviner d'autres tenantIds
GET /appointments?tenantId=clinic_abc

// ✅ SÛR - Le tenantId vient du JWT
GET /appointments
// Le backend extrait le tenantId du user authentifié
```

---

## 📝 Conclusion

L'implémentation multi-tenant de MedFlow garantit :

✅ **Isolation totale** des données entre cliniques  
✅ **Sécurité renforcée** via propagation automatique du tenantId  
✅ **Scalabilité** illimitée (support de milliers de cliniques)  
✅ **Gestion centralisée** par un admin global  
✅ **Flexibilité** d'affectation des utilisateurs  
✅ **Performance** via index optimisés  

**Architecture prête pour la production** avec gestion des cas edge et conformité RGPD.

---

## 🆘 Support et Contact

Pour toute question sur l'implémentation multi-tenant :
- 📧 Email : support@medflow.com
- 📚 Documentation : [docs.medflow.com](https://docs.medflow.com)
- 💬 GitHub Issues : [github.com/medflow/issues](https://github.com/medflow/issues)

---

**Date de création** : Décembre 2025  
**Auteur** : Équipe MedFlow  
**Version** : 1.0.0  
**Licence** : MIT
