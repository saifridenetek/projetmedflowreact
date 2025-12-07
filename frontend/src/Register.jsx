
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  role: z.literal('patient'), // Toujours patient pour l'inscription publique
  phone: z.string().optional(),
  // Champs patients uniquement
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(), // Permettre string vide
  address: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export function Register() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: 'patient', // Toujours patient
    phone: '',
    // Champs patients uniquement
    dateOfBirth: '',
    gender: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value
    }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Préparer les données pour la validation
      const dataToValidate = { ...formData };
      if (dataToValidate.consultationFee) {
        dataToValidate.consultationFee = parseFloat(dataToValidate.consultationFee);
      }

      // Validation avec Zod
      registerSchema.parse(dataToValidate);

      const result = await register(dataToValidate);
      
      if (result.success) {
        // Après inscription réussie, rediriger vers home (connecté automatiquement)
        navigate('/', { 
          state: { 
            message: 'Inscription réussie ! Bienvenue dans MedFlow.',
          }
        });
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Une erreur est survenue' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'doctor':
        return (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label>
                Spécialité *:
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="ex: Cardiologie, Pédiatrie..."
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </label>
              {errors.specialty && <div style={{ color: 'red', fontSize: '12px' }}>{errors.specialty}</div>}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Numéro de licence *:
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="Numéro d'ordre des médecins"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </label>
              {errors.licenseNumber && <div style={{ color: 'red', fontSize: '12px' }}>{errors.licenseNumber}</div>}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Tarif de consultation (€) *:
                <input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  placeholder="ex: 50"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </label>
              {errors.consultationFee && <div style={{ color: 'red', fontSize: '12px' }}>{errors.consultationFee}</div>}
            </div>
          </>
        );

      case 'receptionist':
        return (
          <div style={{ marginBottom: '15px' }}>
            <label>
              Département:
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="ex: Accueil, Urgences..."
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </label>
          </div>
        );

      case 'patient':
        return (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label>
                Date de naissance:
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Sexe:
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Adresse:
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Adresse complète"
                  style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '60px' }}
                />
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '30px', 
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#2c3e50',
        marginBottom: '30px',
        fontSize: '2.5em',
        fontWeight: 'bold'
      }}>
        🏥 Inscription MedFlow
      </h1>
      
      {errors.general && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#dc3545',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        {/* Informations de base */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#495057', marginBottom: '15px' }}>📋 Informations personnelles</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold', color: '#495057' }}>
                Prénom *:
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginTop: '5px',
                    border: '2px solid #e9ecef',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              {errors.firstName && <div style={{ color: 'red', fontSize: '12px' }}>{errors.firstName}</div>}
            </div>

            <div>
              <label style={{ fontWeight: 'bold', color: '#495057' }}>
                Nom *:
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginTop: '5px',
                    border: '2px solid #e9ecef',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              {errors.lastName && <div style={{ color: 'red', fontSize: '12px' }}>{errors.lastName}</div>}
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057' }}>
              Email *:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  marginTop: '5px',
                  border: '2px solid #e9ecef',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                required
              />
            </label>
            {errors.email && <div style={{ color: 'red', fontSize: '12px' }}>{errors.email}</div>}
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057' }}>
              Téléphone:
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  marginTop: '5px',
                  border: '2px solid #e9ecef',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold', color: '#495057' }}>
                Mot de passe *:
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginTop: '5px',
                    border: '2px solid #e9ecef',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              {errors.password && <div style={{ color: 'red', fontSize: '12px' }}>{errors.password}</div>}
            </div>

            <div>
              <label style={{ fontWeight: 'bold', color: '#495057' }}>
                Confirmer le mot de passe *:
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginTop: '5px',
                    border: '2px solid #e9ecef',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              {errors.confirmPassword && <div style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPassword}</div>}
            </div>
          </div>
        </div>

        {/* Sélection du rôle */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#495057', marginBottom: '15px' }}>👥 Inscription Patient</h3>
          
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px', 
            border: '1px solid #bbdefb',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, color: '#1976d2', fontSize: '14px' }}>
              🤒 <strong>Inscription Patient</strong> - Vous vous inscrivez en tant que patient dans le système MedFlow.
              <br />
              Les professionnels de santé sont ajoutés par l'administrateur.
            </p>
          </div>

          {/* Champs spécifiques selon le rôle */}
          {renderRoleSpecificFields()}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '15px', 
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            marginTop: '20px'
          }}
        >
          {loading ? '⏳ Inscription en cours...' : '🚀 Créer mon compte'}
        </button>
      </form>

      <p style={{ 
        textAlign: 'center', 
        marginTop: '30px',
        color: '#6c757d'
      }}>
        Déjà un compte ? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>Se connecter</Link>
      </p>
    </div>
  );
}