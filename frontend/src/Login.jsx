
import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Message de succès venant de la page Register
  const successMessage = location.state?.message;
  const prefilledEmail = location.state?.email;
  
  const [formData, setFormData] = useState({
    email: prefilledEmail || '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Rediriger vers /admin si admin, sinon vers /
      if (user && user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      // Validation avec Zod
      loginSchema.parse(formData);

      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // La redirection sera gérée par useEffect après mise à jour de isAuthenticated
        // On peut aussi obtenir le rôle directement du résultat si disponible
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

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Section gauche avec branding */}
      <div style={{
        flex: '1',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        padding: '50px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          pointerEvents: 'none'
        }} />
        
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '4rem', 
            margin: '0 0 20px 0',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🏥 MedFlow
          </h1>
          <h2 style={{ 
            fontSize: '1.8rem', 
            margin: '0 0 30px 0',
            fontWeight: '300',
            opacity: 0.9
          }}>
            Système de Gestion Médicale
          </h2>
          <div style={{ maxWidth: '400px', fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.8 }}>
            <p>Connectez-vous pour accéder à votre espace personnalisé selon votre rôle dans l'établissement médical.</p>
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>👨‍⚕️</span>
                <span>Médecins</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🤒</span>
                <span>Patients</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>👩‍💼</span>
                <span>Réceptionnistes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🔧</span>
                <span>Administrateurs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite avec formulaire */}
      <div style={{
        flex: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '450px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              color: '#2c3e50',
              fontSize: '2rem',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              🔐 Connexion
            </h2>
            <p style={{ color: '#6c757d', margin: 0 }}>
              Accédez à votre espace personnel
            </p>
          </div>

          {successMessage && (
            <div style={{ 
              color: '#155724',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '25px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ✅ {successMessage}
            </div>
          )}
          
          {errors.general && (
            <div style={{ 
              color: '#721c24',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '25px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ❌ {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ 
                display: 'block',
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '8px'
              }}>
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre.email@exemple.com"
                style={{ 
                  width: '100%', 
                  padding: '15px',
                  border: errors.email ? '2px solid #dc3545' : '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#dc3545' : '#e9ecef'}
              />
              {errors.email && <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>❌ {errors.email}</div>}
            </div>

            <div>
              <label style={{ 
                display: 'block',
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '8px'
              }}>
                🔒 Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Votre mot de passe"
                style={{ 
                  width: '100%', 
                  padding: '15px',
                  border: errors.password ? '2px solid #dc3545' : '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#dc3545' : '#e9ecef'}
              />
              {errors.password && <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>❌ {errors.password}</div>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '15px',
                background: loading ? 
                  '#6c757d' : 
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                transform: loading ? 'none' : 'translateY(0)',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {loading ? '⏳ Connexion en cours...' : '🚀 Se connecter'}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p style={{ 
              color: '#6c757d', 
              margin: '0 0 10px 0',
              fontSize: '14px'
            }}>
              Première fois sur MedFlow ?
            </p>
            <Link 
              to="/register" 
              style={{ 
                color: '#667eea', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              ➕ Créer un compte
            </Link>
          </div>

          {/* Info de démonstration */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#1565c0'
          }}>
            <strong>💡 Info:</strong> Créez un compte en choisissant votre rôle (Patient, Médecin, Réceptionniste, Admin) pour accéder aux fonctionnalités correspondantes.
          </div>
        </div>
      </div>
    </div>
  );
}