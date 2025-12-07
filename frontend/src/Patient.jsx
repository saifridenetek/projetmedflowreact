import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileService, consultationService, prescriptionService } from './services/api';

export default function Patient() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || ''
  });

  // When the auth user changes (after upload/update), sync local form state
  useEffect(() => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      gender: user?.gender || ''
    });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderPatientDashboard = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '1.8rem' }}>Espace patient</h1>
      <p style={{ color: '#718096', marginBottom: '30px' }}>Bienvenue, {user?.firstName} {user?.lastName}</p>
      
      {/* Cartes d'actions rapides supprimées : MES CONSULTATIONS */}

      {/* Informations personnelles */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Mes informations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <p style={{ margin: '5px 0', color: '#718096' }}>
              <strong>Email:</strong> {user?.email}
            </p>
            {user?.phone && (
              <p style={{ margin: '5px 0', color: '#718096' }}>
                <strong>Téléphone:</strong> {user?.phone}
              </p>
            )}
          </div>
          <div>
            {user?.dateOfBirth && (
              <p style={{ margin: '5px 0', color: '#718096' }}>
                <strong>Date de naissance:</strong> {new Date(user.dateOfBirth).toLocaleDateString('fr-FR')}
              </p>
            )}
            {user?.gender && (
              <p style={{ margin: '5px 0', color: '#718096' }}>
                <strong>Sexe:</strong> {user.gender === 'male' ? 'Homme' : user.gender === 'female' ? 'Femme' : 'Autre'}
              </p>
            )}
          </div>
        </div>
        {user?.address && (
          <p style={{ margin: '15px 0 5px 0', color: '#718096' }}>
            <strong>Adresse:</strong> {user.address}
          </p>
        )}
      </div>

      {/* Prochains rendez-vous */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Mes prochains rendez-vous</h2>
        <p style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
          Aucun rendez-vous programmé
        </p>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Prendre rendez-vous</h1>
      <p>Section de prise de rendez-vous en développement...</p>
    </div>
  );

  const renderConsultations = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Mes consultations</h1>
      {(!consultations || consultations.length === 0) ? (
        <p>Aucune consultation trouvée.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {consultations.map(c => (
            <div key={c.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700 }}>{c.doctor?.firstName} {c.doctor?.lastName}</div>
                <div style={{ color: '#64748b' }}>{new Date(c.createdAt).toLocaleString('fr-FR')}</div>
              </div>
              <div style={{ color: '#374151', marginBottom: '8px' }}><strong>Diagnostic:</strong> {c.diagnosis || '—'}</div>
              {c.notes && <div style={{ color: '#4a5568' }}><strong>Notes:</strong> {c.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const fetchConsultations = async () => {
    try {
      const data = await consultationService.getByPatient();
      setConsultations(data || []);
    } catch (err) {
      console.error('Erreur fetching consultations', err);
    }
  };

  useEffect(() => {
    if (activeSection === 'consultations') fetchConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const renderResults = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Mes ordonnances</h1>
      {(!prescriptions || prescriptions.length === 0) ? (
        <p>Aucune ordonnance trouvée.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {prescriptions.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700 }}>{p.doctor?.firstName} {p.doctor?.lastName}</div>
                <div style={{ color: '#64748b' }}>{new Date(p.createdAt).toLocaleString('fr-FR')}</div>
              </div>
              <div style={{ color: '#374151', marginBottom: '8px' }}><strong>Médicament:</strong> {p.medication || '—'}</div>
              {p.dosage && <div style={{ color: '#4a5568' }}><strong>Posologie:</strong> {p.dosage}</div>}
              <div style={{ marginTop: '8px' }}>
                <button onClick={async () => {
                  try {
                    const res = await prescriptionService.generatePDF(p.id);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ordonnance-${p.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Erreur téléchargement PDF', err);
                    alert('Erreur lors du téléchargement du PDF');
                  }
                }} style={{ padding: '8px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>Télécharger PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await profileService.updateProfile(profileData);
      // Refresh auth user so UI shows updated info
      if (refreshUser) await refreshUser();
      setEditingProfile(false);
      alert('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await profileService.uploadPhoto(file);
        // Refresh auth user so photo (and other fields) are updated in UI
        if (refreshUser) await refreshUser();
        alert('Photo mise à jour avec succès !');
      } catch (error) {
        console.error('Erreur lors de l\'upload de la photo:', error);
        alert('Erreur lors de l\'upload de la photo');
      }
    }
  };

  const renderProfile = () => (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: '0', color: '#2d3748' }}>Mon profil</h1>
        <button
          onClick={() => setEditingProfile(!editingProfile)}
          style={{
            padding: '12px 24px',
            backgroundColor: editingProfile ? '#6c757d' : '#e91e63',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {editingProfile ? 'Annuler' : 'Modifier le profil'}
        </button>
      </div>

      {!editingProfile ? (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              marginBottom: '15px'
            }}>
              {user?.photo ? (
                <img
                  src={`http://localhost:3002/uploads/profiles/${user.photo}`}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                '👤'
              )}
            </div>
            <h2 style={{ margin: '0', color: '#2d3748' }}>
              {user?.firstName} {user?.lastName}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div>
              <h3 style={{ color: '#4a5568', marginBottom: '15px' }}>Informations personnelles</h3>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#2d3748' }}>Email:</strong>
                <p style={{ margin: '4px 0', color: '#718096' }}>{user?.email}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#2d3748' }}>Téléphone:</strong>
                <p style={{ margin: '4px 0', color: '#718096' }}>{user?.phone || 'Non renseigné'}</p>
              </div>
            </div>
            <div>
              <h3 style={{ color: '#4a5568', marginBottom: '15px' }}>Informations médicales</h3>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#2d3748' }}>Date de naissance:</strong>
                <p style={{ margin: '4px 0', color: '#718096' }}>
                  {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseigné'}
                </p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#2d3748' }}>Sexe:</strong>
                <p style={{ margin: '4px 0', color: '#718096' }}>
                  {user?.gender === 'male' ? 'Homme' : user?.gender === 'female' ? 'Femme' : user?.gender === 'other' ? 'Autre' : 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile} style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              marginBottom: '15px',
              position: 'relative'
            }}>
              {user?.photo ? (
                <img
                  src={`http://localhost:3002/uploads/profiles/${user.photo}`}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                '👤'
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
            <p style={{ margin: '0', color: '#718096', fontSize: '0.9rem' }}>
              Cliquer pour changer la photo
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={profileData.dateOfBirth ? (typeof profileData.dateOfBirth === 'string' && profileData.dateOfBirth.includes('T') ? profileData.dateOfBirth.split('T')[0] : profileData.dateOfBirth) : ''}
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Sexe
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              type="submit"
              style={{
                padding: '14px 32px',
                backgroundColor: '#e91e63',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginRight: '15px'
              }}
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const fetchPrescriptions = async () => {
    try {
      const data = await prescriptionService.getByPatient();
      setPrescriptions(data || []);
    } catch (err) {
      console.error('Erreur fetching prescriptions', err);
    }
  };

  useEffect(() => {
    if (activeSection === 'prescriptions') fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: 'linear-gradient(180deg, #ad1457 0%, #e91e63 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header sidebar */}
        <div style={{
          padding: '25px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '8px' }}>
            🏥 MedFlow
          </div>
          <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>
            Espace Patient
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {[
              { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
              { id: 'consultations', label: 'Mes consultations', icon: '📋' },
              { id: 'prescriptions', label: 'Mes ordonnances', icon: '�' },
              { id: 'profile', label: 'Mon profil', icon: '👤' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%',
                padding: '18px 25px',
                background: activeSection === item.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: 'none',
                borderLeft: activeSection === item.id ? '4px solid #f06292' : '4px solid transparent',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                margin: '4px 0'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{
          padding: '25px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            marginBottom: '15px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>
              Patient
            </div>
            <div style={{ fontSize: '0.8rem', opacity: '0.7' }}>
              Membre depuis: {new Date(user?.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc'
      }}>
        {/* Header principal */}
        <div style={{
          background: 'white',
          padding: '20px 35px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ margin: '0', color: '#2d3748', fontSize: '1.4rem' }}>
            {activeSection === 'dashboard' && '📊 Tableau de bord'}
            {activeSection === 'appointments' && '📅 Prendre rendez-vous'}
            {activeSection === 'consultations' && '📋 Mes consultations'}
            {activeSection === 'prescriptions' && '� Mes ordonnances'}
            {activeSection === 'profile' && '👤 Mon profil'}
          </h2>
          <div style={{ color: '#718096', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Contenu des sections */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeSection === 'dashboard' && renderPatientDashboard()}
          {activeSection === 'appointments' && renderAppointments()}
          {activeSection === 'consultations' && renderConsultations()}
          {activeSection === 'prescriptions' && renderResults()}
          {activeSection === 'profile' && renderProfile()}
        </div>
      </div>
    </div>
  );
}