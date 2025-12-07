# 📋 MedFlow - Documentation Complète du Projet

## 🎯 Vue d'ensemble du projet

MedFlow est une application web full-stack avec authentification JWT et système de rôles. Elle comprend :
- **Frontend** : React + Vite avec gestion d'état via Context API
- **Backend** : NestJS avec TypeORM et PostgreSQL
- **Authentification** : JWT avec rôles (user/admin)
- **Base de données** : PostgreSQL avec pgAdmin

---

## 🚀 Commandes Principales du Projet

### 📁 Commandes de Démarrage

```bash
# Backend (NestJS)
npm i -g @nestjs/cli
nest new backend
cd backend
npm run start:dev             # Démarrer en mode développement (hot-reload)
npm run start                 # Démarrer en mode production
npm run build                 # Compiler le projet

# Frontend (React + Vite)
npm create vite@latest frontend -- --template react
cd frontend
npm run dev ou npm run start  # Démarrer le serveur de développement
npm run build                 # Compiler pour la production
npm run preview               # Prévisualiser le build de production
```

### 🗄️ Commandes Base de Données


# Via pgAdmin (interface graphique)
# - Créer base de données "medflow"
# - Gérer les utilisateurs et tables

#pour rendre un utilisateur admin
-- Mettre à jour un utilisateur existant pour en faire un admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'saif@gmail.com';
```

### 🛠️ Commandes de Développement

# Tests
npm run test                 # Exécuter les tests
npm run test:watch           # Tests en mode watch
```

---

## 🎨 Frontend - Architecture et Fonctionnalités

### 📂 Structure des Dossiers

```
frontend/src/
├── components/              # Composants réutilisables
│   ├── ProtectedRoute.jsx   # Protection des routes authentifiées
│   └── AdminRoute.jsx       # Protection des routes admin
├── contexts/               # Contextes React
│   └── AuthContext.jsx     # Gestion globale de l'authentification
├── pages/                  # Pages principales
│   ├── Home.jsx           # Page d'accueil (protégée)
│   ├── Login.jsx          # Page de connexion
│   ├── Register.jsx       # Page d'inscription
│   └── Admin.jsx          # Page administration (admin seulement)
├── App.jsx                # Composant racine avec routing
└── main.jsx              # Point d'entrée de l'application
```

### 🔧 Technologies et Bibliothèques

- **React 19.1.1** : Framework principal
- **React Router DOM** : Navigation et routing
- **Zod** : Validation des formulaires côté client
- **Vite** : Build tool et serveur de développement

### 📋 Composants Détaillés

#### **🔐 AuthContext.jsx** - Gestion Globale de l'Authentification

**Rôle** : Contexte React qui gère l'état d'authentification dans toute l'application.

**État géré :**
```javascript
const [user, setUser] = useState(null);           // Données utilisateur
const [token, setToken] = useState(localStorage.getItem('token')); // Token JWT
const [loading, setLoading] = useState(true);     // État de chargement
```

**Fonctions principales :**

1. **`fetchUserProfile()`**
   - **Rôle** : Récupère le profil utilisateur depuis l'API
   - **Déclenchement** : Automatique au chargement si token présent
   - **Gestion d'erreur** : Supprime le token invalide du localStorage

2. **`login(email, password)`**
   - **Rôle** : Authentifie l'utilisateur
   - **Processus** :
     - Envoie requête POST vers `/auth/login`
     - Stocke le token dans localStorage
     - Met à jour l'état global
     - Affiche le token dans la console (logs de debug)
   - **Retour** : `{ success: boolean, error?: string }`

3. **`register(userData)`**
   - **Rôle** : Inscrit un nouvel utilisateur
   - **Processus** :
     - Envoie requête POST vers `/auth/register`
     - NE connecte PAS automatiquement (flux: Register → Login → Home)
   - **Retour** : `{ success: boolean, error?: string }`

4. **`logout()`**
   - **Rôle** : Déconnecte l'utilisateur
   - **Actions** :
     - Supprime le token du localStorage
     - Remet à zéro l'état utilisateur
     - Force la redirection vers login

5. **`getUserRoleFromToken(token)`**
   - **Rôle** : Décode le JWT pour extraire le rôle
   - **Logique** : Parse le payload JWT (base64)
   - **Retour** : 'admin' | 'user' | null

**Valeurs exposées :**
```javascript
{
  user,                    // Objet utilisateur complet
  token,                   // Token JWT brut
  loading,                 // État de chargement
  login,                   // Fonction de connexion
  register,                // Fonction d'inscription
  logout,                  // Fonction de déconnexion
  isAuthenticated,         // Boolean : !!token && !!user
  userRole,               // 'admin' | 'user' | null
  isAdmin,                // Boolean : userRole === 'admin'
  isUser                  // Boolean : userRole === 'user'
}
```

#### **🏠 Home.jsx** - Page d'Accueil Protégée

**Rôle** : Page principale accessible après authentification, avec affichage conditionnel selon le rôle.

**Hooks utilisés :**
- `useAuth()` : Accès au contexte d'authentification
- `useNavigate()` : Navigation programmatique

**Logique d'affichage conditionnel :**
```javascript
// Administrateurs voient :
{isAdmin && (
  <Link to="/admin">👑 Panneau d'Administration</Link>
)}

// Utilisateurs standards voient :
{userRole === 'user' && (
  <div>🏠 Espace Utilisateur</div>
)}
```

**Fonctions :**
1. **`handleLogout()`**
   - Appelle `logout()` du contexte
   - Redirige vers `/login`

#### **🔑 Login.jsx** - Page de Connexion

**Rôle** : Formulaire de connexion avec validation Zod et gestion d'erreurs.

**State local :**
```javascript
const [formData, setFormData] = useState({
  email: '',
  password: ''
});
const [errors, setErrors] = useState({});    // Erreurs de validation
const [loading, setLoading] = useState(false); // État du submit
```

**Schema de validation Zod :**
```javascript
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});
```

**Fonctions :**

1. **`handleChange(e)`**
   - **Rôle** : Met à jour le state du formulaire
   - **Nettoyage** : Efface l'erreur du champ modifié en temps réel

2. **`handleSubmit(e)`**
   - **Processus** :
     1. Validation Zod du formulaire
     2. Appel `login()` du contexte
     3. Gestion des erreurs (validation ou serveur)
     4. Redirection vers `/` si succès

**Gestion des erreurs :**
- Erreurs Zod : Affichage par champ
- Erreurs serveur : Message global
- État loading : Désactivation du bouton

#### **📝 Register.jsx** - Page d'Inscription

**Rôle** : Formulaire d'inscription avec validation avancée et confirmation de mot de passe.

**State local :**
```javascript
const [formData, setFormData] = useState({
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
});
```

**Schema de validation Zod avancé :**
```javascript
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  }
);
```

**Flux d'inscription :**
1. Utilisateur remplit le formulaire
2. Validation Zod côté client
3. Envoi vers API `/auth/register`
4. **Redirection vers `/login`** (pas de connexion automatique)
5. Message de succès affiché sur login

#### **🛡️ ProtectedRoute.jsx** - Protection des Routes

**Rôle** : HOC (Higher-Order Component) qui protège les routes nécessitant une authentification.

**Logique :**
```javascript
if (loading) return <div>Chargement...</div>;
if (!isAuthenticated) return <Navigate to="/login" replace />;
return children; // Affiche le composant protégé
```

#### **👑 AdminRoute.jsx** - Protection des Routes Admin

**Rôle** : HOC spécialisé pour les routes nécessitant des privilèges administrateur.

**Logique de sécurité :**
```javascript
if (loading) return <div>Chargement...</div>;
if (!isAuthenticated) return <Navigate to="/login" replace />;
if (!isAdmin) return <AccessDeniedMessage />;
return children;
```

**Message d'accès refusé :**
- Interface utilisateur claire expliquant la restriction
- Bouton "Retour" pour navigation

#### **🔍 Admin.jsx** - Page d'Administration

**Rôle** : Interface administrateur pour consulter les utilisateurs et vérifier les tokens.

**State local :**
```javascript
const [users, setUsers] = useState([]);              // Liste des utilisateurs
const [tokenVerification, setTokenVerification] = useState(null); // Infos token
const [loading, setLoading] = useState(true);        // État de chargement
```

**Fonctions API :**

1. **`fetchUsers()`**
   - **Endpoint** : `GET /admin/users`
   - **Headers** : `Authorization: Bearer ${token}`
   - **Rôle** : Récupère tous les utilisateurs (admin seulement)

2. **`verifyToken()`**
   - **Endpoint** : `GET /auth/verify-token`
   - **Rôle** : Vérifie la validité du token actuel

**Sécurité :**
- Accessible uniquement via `AdminRoute`
- Vérification des permissions côté serveur
- Affichage conditionnel selon les données reçues

#### **🔄 App.jsx** - Configuration du Routing

**Rôle** : Composant racine qui configure le routing et encapsule l'application dans les providers.

**Structure de routing :**
```javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/" element={
    <ProtectedRoute><Home /></ProtectedRoute>
  } />
  <Route path="/admin" element={
    <AdminRoute><Admin /></AdminRoute>
  } />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

**Providers hierarchy :**
```javascript
<AuthProvider>          // Contexte d'authentification global
  <Router>              // Configuration React Router
    <div className="App">
      <Routes>...</Routes>
    </div>
  </Router>
</AuthProvider>
```

---

## ⚙️ Backend - Architecture et Fonctionnalités

### 📂 Structure des Dossiers

```
backend/src/
├── auth/                   # Module d'authentification
│   ├── auth.controller.ts  # Contrôleur auth (login, register)
│   ├── auth.service.ts     # Service métier authentification
│   ├── auth.module.ts      # Module NestJS
│   ├── jwt.strategy.ts     # Stratégie Passport JWT
│   ├── jwt-auth.guard.ts   # Guard de protection JWT
│   ├── roles.guard.ts      # Guard de vérification des rôles
│   ├── roles.decorator.ts  # Décorateur pour définir les rôles
│   └── dto/
│       └── auth.dto.ts     # DTOs avec validation Zod
├── admin/                  # Module administration
│   ├── admin.controller.ts # Contrôleur admin
│   └── admin.module.ts     # Module admin
├── user/                   # Module utilisateur
│   ├── user.controller.ts  # Contrôleur user
│   └── user.module.ts      # Module user
├── entities/               # Entités TypeORM
│   └── user.entity.ts      # Entité User
├── app.module.ts           # Module principal
└── main.ts                # Point d'entrée
```

### 🔧 Technologies Backend

- **NestJS 11.0.1** : Framework Node.js
- **TypeORM** : ORM pour PostgreSQL
- **PostgreSQL** : Base de données relationnelle
- **JWT** : Authentification par tokens
- **Bcryptjs** : Hachage des mots de passe
- **Zod + nestjs-zod** : Validation des données
- **Passport** : Authentification middleware

### 📋 Modules Détaillés

#### **🔐 Auth Module** - Authentification

##### **auth.service.ts** - Service Métier

**Rôle** : Gère toute la logique d'authentification et de gestion des utilisateurs.

**Dépendances injectées :**
```typescript
constructor(
  @InjectRepository(User) private userRepository: Repository<User>,
  private jwtService: JwtService,
) {}
```

**Méthodes principales :**

1. **`register(registerDto: RegisterDto)`**
   - **Validation** : Données validées par Zod avant arrivée
   - **Vérifications** :
     - Email unique dans la base
     - Mot de passe >= 6 caractères
     - Confirmation de mot de passe
   - **Processus** :
     ```typescript
     const hashedPassword = await bcrypt.hash(password, 10); // Hachage bcrypt
     const user = this.userRepository.create({
       email, username, password: hashedPassword, role: 'user' // Rôle par défaut
     });
     await this.userRepository.save(user);
     ```
   - **Token JWT** : `{ email, sub: id, role }`
   - **Erreurs** : `ConflictException` si email existe

2. **`login(loginDto: LoginDto)`**
   - **Vérifications** :
     - Utilisateur existe par email
     - Mot de passe valide avec bcrypt.compare()
   - **Token JWT** : Même payload que register
   - **Erreurs** : `UnauthorizedException` si échec

3. **`validateUser(payload: JwtPayload)`**
   - **Rôle** : Méthode appelée par JWT Strategy
   - **Processus** : Récupère l'utilisateur complet depuis l'ID token
   - **Sécurité** : Exclut le mot de passe du retour

4. **`getAllUsers()`**
   - **Rôle** : Liste tous les utilisateurs (admin uniquement)
   - **Sécurité** : Exclusion des mots de passe

5. **`getUserProfile(userId: number)`**
   - **Rôle** : Récupère le profil d'un utilisateur spécifique

##### **auth.controller.ts** - Contrôleur API

**Endpoints exposés :**

1. **`POST /auth/register`**
   ```typescript
   @Post('register')
   async register(@Body() registerDto: RegisterDto) {
     return this.authService.register(registerDto);
   }
   ```
   - **Body** : `{ email, username, password, confirmPassword }`
   - **Validation** : Automatique via Zod
   - **Retour** : `{ access_token: string }`

2. **`POST /auth/login`**
   ```typescript
   @Post('login')
   async login(@Body() loginDto: LoginDto) {
     return this.authService.login(loginDto);
   }
   ```
   - **Body** : `{ email, password }`
   - **Retour** : `{ access_token: string }`

3. **`GET /auth/profile`**
   ```typescript
   @Get('profile')
   @UseGuards(JwtAuthGuard)
   getProfile(@Request() req) {
     return req.user; // Utilisateur depuis JWT
   }
   ```
   - **Protection** : JWT requis
   - **Retour** : Profil utilisateur sans mot de passe

4. **`GET /auth/verify-token`**
   ```typescript
   @Get('verify-token')
   @UseGuards(JwtAuthGuard)
   verifyToken(@Request() req) {
     return {
       valid: true,
       user: req.user,
       message: 'Token valide'
     };
   }
   ```

##### **DTOs et Validation Zod**

**auth.dto.ts** - Objets de Transfert de Données

1. **RegisterSchema**
   ```typescript
   export const RegisterSchema = z.object({
     email: z.string().email('Email invalide'),
     username: z.string().min(3, 'Nom utilisateur >= 3 caractères'),
     password: z.string().min(6, 'Mot de passe >= 6 caractères'),
     confirmPassword: z.string()
   }).refine(
     (data) => data.password === data.confirmPassword,
     { message: "Mots de passe différents", path: ["confirmPassword"] }
   );
   ```

2. **LoginSchema**
   ```typescript
   export const LoginSchema = z.object({
     email: z.string().email('Email invalide'),
     password: z.string().min(1, 'Mot de passe requis'),
   });
   ```

##### **Sécurité JWT**

**jwt.strategy.ts** - Stratégie Passport

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return this.authService.validateUser(payload); // Récupère user complet
  }
}
```

**jwt-auth.guard.ts** - Guard de Protection

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```
- **Usage** : `@UseGuards(JwtAuthGuard)`
- **Effet** : Vérifie token, injecte user dans Request

##### **Système de Rôles**

**roles.decorator.ts** - Décorateur de Rôles

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```
- **Usage** : `@Roles('admin', 'user')`

**roles.guard.ts** - Guard de Vérification des Rôles

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
```

#### **👑 Admin Module** - Administration

##### **admin.controller.ts** - Contrôleur Admin

**Protection** : `@UseGuards(JwtAuthGuard, RolesGuard)`

**Endpoints :**

1. **`GET /admin/users`**
   ```typescript
   @Get('users')
   @Roles('admin')
   async getAllUsers() {
     const users = await this.authService.getAllUsers();
     return {
       message: 'Liste de tous les utilisateurs',
       users: users,
       count: users.length
     };
   }
   ```

2. **`GET /admin/dashboard`**
   ```typescript
   @Get('dashboard')
   @Roles('admin')
   async getAdminDashboard() {
     // Statistiques utilisateurs
     // Derniers utilisateurs inscrits
   }
   ```

#### **👤 User Module** - Utilisateurs

##### **user.controller.ts** - Contrôleur User

**Endpoints réservés aux utilisateurs standard :**

1. **`GET /user/profile`**
   ```typescript
   @Get('profile')
   @Roles('user')
   async getUserProfile(@Request() req) {
     return this.authService.getUserProfile(req.user.id);
   }
   ```

2. **`GET /user/dashboard`**
   ```typescript
   @Get('dashboard')
   @Roles('user')
   async getUserDashboard(@Request() req) {
     // Dashboard personnalisé utilisateur
   }
   ```

#### **📊 Entité User** - Modèle de Données

**user.entity.ts** - Entité TypeORM

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;                    // Email unique

  @Column()
  username: string;                 // Nom d'utilisateur

  @Column()
  password: string;                 // Mot de passe haché (bcrypt)

  @Column({ default: 'user' })
  role: string;                     // 'user' | 'admin'

  @CreateDateColumn()
  createdAt: Date;                  // Date de création automatique

  @UpdateDateColumn()
  updatedAt: Date;                  // Date de modification automatique
}
```

**Contraintes :**
- Email unique (index PostgreSQL)
- Rôle par défaut : 'user'
- Timestamps automatiques

#### **⚙️ Configuration Principale**

##### **app.module.ts** - Module Racine

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),     // Variables d'environnement
    TypeOrmModule.forRootAsync({                  // Configuration PostgreSQL
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User],
        synchronize: true,  // ⚠️ Désactiver en production
      }),
    }),
    AuthModule,    // Module d'authentification
    AdminModule,   // Module administration
    UserModule,    // Module utilisateur
  ],
})
```

##### **main.ts** - Point d'Entrée

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS pour le frontend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Validation globale avec Zod
  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(3002);
  console.log('Backend démarré sur http://localhost:3002');
}
```

---

## 🗄️ Base de Données - Guide Complet PostgreSQL

### 📋 Configuration et Installation

#### **1. Installation PostgreSQL**

**Via installateur officiel :**
1. Télécharger PostgreSQL depuis postgresql.org
2. Installer avec pgAdmin inclus
3. Définir un mot de passe pour l'utilisateur `postgres`
4. Noter le port (défaut: 5432)

**Via Docker (alternative) :**
```bash
docker-compose up -d
```

#### **2. Configuration dans pgAdmin**

**Étapes de connexion :**
1. Ouvrir pgAdmin
2. Créer une connexion serveur :
   - **Host** : localhost
   - **Port** : 5432
   - **Username** : postgres
   - **Password** : [votre mot de passe]

#### **3. Création de la Base de Données**

**Via pgAdmin :**
1. Clic droit sur "Databases"
2. Create → Database
3. **Name** : `medflow`
4. **Owner** : `postgres`
5. Save

**Via SQL :**
```sql
CREATE DATABASE medflow
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
```

### 📊 Structure de la Base de Données

#### **Table `users`** - Utilisateurs

**Création automatique via TypeORM :**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                          -- Clé primaire auto-incrémentée
    email VARCHAR UNIQUE NOT NULL,                  -- Email unique (contrainte)
    username VARCHAR NOT NULL,                      -- Nom d'utilisateur
    password VARCHAR NOT NULL,                      -- Mot de passe haché (bcrypt)
    role VARCHAR DEFAULT 'user',                    -- Rôle ('user' | 'admin')
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date de création
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Date de modification
);
```

**Index automatiques :**
- Primary key sur `id`
- Unique index sur `email`
- Index sur `createdAt` et `updatedAt` (TypeORM)

#### **Configuration TypeORM**

**Variables d'environnement (.env) :**
```bash
DATABASE_HOST=localhost          # Serveur PostgreSQL
DATABASE_PORT=5432              # Port PostgreSQL
DATABASE_USERNAME=postgres      # Utilisateur DB
DATABASE_PASSWORD=saif          # Mot de passe DB
DATABASE_NAME=medflow           # Nom de la base
JWT_SECRET=your-secret-key      # Clé secrète JWT
JWT_EXPIRES_IN=1d              # Durée de validité token
```

**Synchronisation automatique :**
```typescript
// app.module.ts
synchronize: true  // ⚠️ Uniquement en développement !
```
- **Effet** : TypeORM créée/modifie automatiquement les tables
- **Production** : Utiliser les migrations TypeORM

### 🔍 Requêtes SQL Utiles

#### **Consultation des Utilisateurs**

```sql
-- Voir tous les utilisateurs
SELECT 
    id,
    username,
    email,
    role,
    "createdAt" as date_inscription,
    "updatedAt" as derniere_modification
FROM users 
ORDER BY "createdAt" DESC;

-- Compter les utilisateurs par rôle
SELECT 
    role,
    COUNT(*) as nombre
FROM users 
GROUP BY role;

-- Utilisateurs inscrits aujourd'hui
SELECT * FROM users 
WHERE DATE("createdAt") = CURRENT_DATE;

-- Utilisateurs de la dernière semaine
SELECT * FROM users 
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

#### **Gestion des Rôles**

```sql
-- Transformer un utilisateur en admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Créer un admin manuellement (avec mot de passe haché)
INSERT INTO users (email, username, password, role, "createdAt", "updatedAt")
VALUES (
    'admin@medflow.com',
    'Administrator',
    '$2b$10$[hash-bcrypt-ici]',  -- Générer via bcrypt
    'admin',
    NOW(),
    NOW()
);

-- Lister tous les admins
SELECT * FROM users WHERE role = 'admin';

-- Stats des rôles
SELECT 
    role,
    COUNT(*) as total,
    MIN("createdAt") as premier_utilisateur,
    MAX("createdAt") as dernier_utilisateur
FROM users 
GROUP BY role;
```

#### **Maintenance et Sécurité**

```sql
-- Vérifier l'intégrité des données
SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT email) as emails_uniques,
    (COUNT(*) - COUNT(DISTINCT email)) as doublons_email
FROM users;

-- Utilisateurs sans rôle défini
SELECT * FROM users WHERE role IS NULL OR role = '';

-- Nettoyer les anciens utilisateurs (exemple: > 1 an)
DELETE FROM users 
WHERE "createdAt" < NOW() - INTERVAL '1 year' 
AND role = 'user';

-- Backup de la table
CREATE TABLE users_backup AS SELECT * FROM users;
```

### 🔒 Sécurité Base de Données

#### **Contraintes et Validations**

```sql
-- Ajouter contrainte sur le rôle
ALTER TABLE users 
ADD CONSTRAINT check_role 
CHECK (role IN ('user', 'admin'));

-- Ajouter contrainte email format
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Index pour performance sur les requêtes de rôle
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users("createdAt");
```

#### **Instructions pour ajouter un admin manuellement**

**Méthode 1 : Via inscription puis modification SQL**
1. Créez un compte normal via l'interface d'inscription
2. Dans pgAdmin, exécutez :
```sql
UPDATE users SET role = 'admin' WHERE email = 'votre-email@example.com';
```

**Méthode 2 : Génération de hash bcrypt**
```bash
# Dans Node.js
node -e "console.log(require('bcryptjs').hashSync('motdepasse123', 10))"
```

Puis insérez directement :
```sql
INSERT INTO users (email, username, password, role, "createdAt", "updatedAt")
VALUES (
    'admin@medflow.com',
    'admin',
    '$2b$10$[votre-hash-bcrypt]',
    'admin',
    NOW(),
    NOW()
);
```

---

## 🚀 Déploiement et Production

### 🔧 Variables d'Environnement de Production

```bash
# Production .env
NODE_ENV=production
DATABASE_HOST=production-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=medflow_user
DATABASE_PASSWORD=super-secure-password
DATABASE_NAME=medflow_prod
JWT_SECRET=very-long-random-secret-key-256-bits
JWT_EXPIRES_IN=24h

# SSL Database
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

### 📋 Checklist de Sécurité

**Backend :**
- [ ] `synchronize: false` en production
- [ ] Utiliser les migrations TypeORM
- [ ] Variables d'environnement sécurisées
- [ ] HTTPS uniquement
- [ ] Rate limiting sur les endpoints
- [ ] Logs d'audit complets
- [ ] Backup automatique de la DB

**Frontend :**
- [ ] Build optimisé (`npm run build`)
- [ ] Variables d'environnement de production
- [ ] HTTPS uniquement
- [ ] CSP (Content Security Policy)
- [ ] Tokens expirés gérés proprement

**Base de Données :**
- [ ] Utilisateur dédié (pas postgres)
- [ ] Permissions minimales
- [ ] Backup automatique quotidien
- [ ] Monitoring des performances
- [ ] SSL/TLS activé

---

## 🐛 Debugging et Résolution de Problèmes

### 🔍 Problèmes Courants

#### **Erreur de Connexion PostgreSQL**
```bash
# Erreur: authentification par mot de passe échouée
# Solution:
1. Vérifier le mot de passe dans .env
2. Vérifier que PostgreSQL est démarré
3. Tester la connexion dans pgAdmin
```

#### **Token JWT Invalide**
```javascript
// Frontend: Vérifier token dans localStorage
console.log('Token:', localStorage.getItem('token'));

// Backend: Logs dans jwt.strategy.ts
console.log('JWT Payload:', payload);
```

#### **Problèmes de CORS**
```typescript
// Vérifier configuration CORS dans main.ts
app.enableCors({
  origin: 'http://localhost:5173',  // URL exacte du frontend
  credentials: true,
});
```

### 📊 Monitoring et Logs

**Logs utiles à ajouter :**
```typescript
// auth.service.ts
console.log('Login attempt for:', email);
console.log('User registered:', user.email);
console.log('JWT payload created:', payload);

// Frontend AuthContext
console.log('Login successful:', result);
console.log('Token stored:', localStorage.getItem('token'));
```

---

## 📚 Ressources et Documentation

### 🔗 Liens Utiles

- **NestJS** : https://nestjs.com/
- **TypeORM** : https://typeorm.io/
- **React** : https://react.dev/
- **PostgreSQL** : https://postgresql.org/
- **JWT** : https://jwt.io/
- **Zod** : https://zod.dev/

### 📖 Commandes de Référence

```bash
# Génération de hash bcrypt (Node.js)
node -e "console.log(require('bcryptjs').hashSync('password', 10))"

# Test API avec curl
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Vérification token JWT
curl -X GET http://localhost:3002/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ Conclusion

Ce projet MedFlow implémente une architecture moderne et sécurisée avec :

- **Frontend React** avec gestion d'état via Context API
- **Backend NestJS** avec architecture modulaire
- **Authentification JWT** avec système de rôles
- **Base de données PostgreSQL** avec TypeORM
- **Validation Zod** côté client et serveur
- **Protection des routes** selon les rôles utilisateur

Le système est prêt pour le développement et peut être étendu avec des fonctionnalités supplémentaires selon les besoins du projet.