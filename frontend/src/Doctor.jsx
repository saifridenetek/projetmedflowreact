import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentService, userService, consultationService, prescriptionService } from './services/api';

export default function Doctor() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]); // local state for now
  const [consultationOpenFor, setConsultationOpenFor] = useState(null);
  const [consultationsCount, setConsultationsCount] = useState(0);
  const [consultations, setConsultations] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderDoctorDashboard = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '1.8rem' }}>Tableau de bord médecin</h1>
      <p style={{ color: '#718096', marginBottom: '30px' }}>Bienvenue, Dr. {user?.firstName} {user?.lastName}</p>
      
      {/* Cartes statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>Rendez-vous du jour</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{myAppointments.filter(a => isToday(new Date(a.appointment_datetime))).length}</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>patients prévus</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>Consultations</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{consultationsCount}</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>ce mois</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>Prescriptions</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{prescriptions.length}</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>émises</div>
        </div>
      </div>
      {/* Latest consultations */}
      {consultations && consultations.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={{ marginBottom: '8px', color: '#2d3748' }}>Dernières consultations</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {consultations.slice(0,5).map(c => (
              <li key={c.id} style={{ background: 'white', padding: '10px', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'}}>
                <div style={{ fontWeight: 700 }}>{c.patient?.firstName} {c.patient?.lastName}</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(c.createdAt).toLocaleString('fr-FR')} — {c.diagnosis || '—'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // helper to check if date is today
  function isToday(d) {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  const renderAppointments = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Mes Rendez-vous</h1>
      {myAppointments.length === 0 ? (
        <p>Aucun rendez-vous planifié.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e6edf3' }}>
              <th>Patient</th>
              <th>Date et heure</th>
              <th>Raison</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {myAppointments.map(appt => (
              <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 8px' }}>{appt.patient?.firstName} {appt.patient?.lastName}</td>
                <td style={{ padding: '12px 8px' }}>{new Date(appt.appointment_datetime).toLocaleString('fr-FR')}</td>
                <td style={{ padding: '12px 8px' }}>{appt.reason || '-'}</td>
                <td style={{ padding: '12px 8px' }}>
                  {appt.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={async () => { await handleSetStatus(appt.id, 'accepted'); }} style={{ padding: '6px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Accepter</button>
                      <button onClick={async () => { await handleSetStatus(appt.id, 'refused'); }} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Refuser</button>
                    </div>
                  ) : appt.status === 'accepted' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>Accepté</span>
                      <button onClick={() => setConsultationOpenFor(appt)} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Commencer consultation</button>
                    </div>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>Refusé</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Consultation form inline modal
  function ConsultationForm({ appointment, onClose }) {
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await consultationService.create({ appointmentId: appointment.id, patientId: appointment.patient.id, diagnosis, notes });
        alert('Consultation enregistrée');
        setConsultationsCount(c => c + 1);
        onClose();
        // Optionally refresh appointments or consultations
        fetchAppointments();
        fetchConsultations();
      } catch (err) {
        console.error('Erreur creating consultation', err);
        alert('Erreur lors de la création de la consultation');
      }
    };

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '720px' }}>
          <h2>Consultation — {appointment.patient?.firstName} {appointment.patient?.lastName}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '8px' }}>
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnostic" required style={{ minHeight: '80px' }} />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes complémentaires (optionnel)" style={{ minHeight: '60px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: '6px' }}>Annuler</button>
              <button type="submit" style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPatients = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Mes Patients</h1>
      {patients.length === 0 ? (
        <p>Aucun patient trouvé.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {patients.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: '700' }}>{p.firstName} {p.lastName}</div>
              <div style={{ color: '#64748b' }}>{p.email || '—'} • {p.phone || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPrescriptions = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Prescriptions</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>Créer une ordonnance</h3>
        <PrescriptionForm patients={patients} onCreate={(presc) => setPrescriptions([presc, ...prescriptions])} />
      </div>

      <h3>Ordonnances émises</h3>
      {prescriptions.length === 0 ? (
        <p>Aucune ordonnance créée.</p>
      ) : (
        <ul>
          {prescriptions.map((p) => (
            <li key={p.id} style={{ marginBottom: '8px' }}>
              <strong>{p.patient?.firstName} {p.patient?.lastName || p.patientName}</strong> — {p.medication} ({p.dosage})
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
              }} style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '0.9rem' }}>Télécharger PDF</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  function PrescriptionForm({ patients, onCreate }) {
    const [patientId, setPatientId] = useState(patients?.[0]?.id || '');
    const [medication, setMedication] = useState('');
    const [dosage, setDosage] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
      if (patients && patients.length && !patientId) setPatientId(patients[0].id);
    }, [patients]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const saved = await prescriptionService.create({ patientId: Number(patientId), medication, dosage, notes });
        // normalize shape for local display
        const patient = patients.find(p => p.id === Number(patientId)) || {};
        const presc = { ...saved, patientName: `${patient.firstName} ${patient.lastName}` };
        onCreate(presc);
        setMedication(''); setDosage(''); setNotes('');
        alert('Ordonnance créée');
        fetchPrescriptions();
      } catch (err) {
        console.error('Erreur creating prescription', err);
        alert('Erreur lors de la création de l\'ordonnance');
      }
    };

    return (
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '8px', maxWidth: '600px' }}>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
          <option value="">Sélectionner un patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
        <input value={medication} onChange={(e)=>setMedication(e.target.value)} placeholder="Médicament" required />
        <input value={dosage} onChange={(e)=>setDosage(e.target.value)} placeholder="Dosage" required />
        <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Notes (optionnel)" />
        <button type="submit" style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>Créer</button>
      </form>
    );
  }

  // Fetch data functions
  const fetchAppointments = async () => {
    try {
      let data = [];
      if (user?.role === 'doctor') {
        data = await appointmentService.getByDoctor(user.id);
      } else {
        data = await appointmentService.getAll();
      }
      setAppointments(data || []);
    } catch (err) {
      console.error('Erreur fetching appointments', err);
    }
  };

  // allow doctor to change appointment status
  const handleSetStatus = async (id, status) => {
    try {
      await appointmentService.update(id, { status });
      await fetchAppointments();
    } catch (err) {
      console.error('Erreur mise à jour status', err);
      alert('Erreur lors de la mise à jour du statut du rendez-vous');
    }
  };

  const fetchConsultations = async () => {
    try {
      const data = await consultationService.getByDoctor();
      setConsultations(data || []);
      setConsultationsCount((data || []).length);
    } catch (err) {
      console.error('Erreur fetching consultations', err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const data = await prescriptionService.getByDoctor();
      setPrescriptions(data || []);
    } catch (err) {
      console.error('Erreur fetching prescriptions', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      // keep as fallback for prescriptions/patient select
      // setPatients will be derived from appointments, but store full users for safety
      // Not overriding patients derived from appointments here
    } catch (err) {
      console.error('Erreur fetching users', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchConsultations();
    fetchPrescriptions();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    const mine = appointments.filter(a => a.doctor?.id === user.id);
    setMyAppointments(mine);
    const unique = [];
    const seen = new Set();
    mine.forEach(a => {
      if (a.patient && !seen.has(a.patient.id)) {
        unique.push(a.patient);
        seen.add(a.patient.id);
      }
    });
    setPatients(unique);
  }, [appointments, user]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#2d3748',
        color: 'white',
        padding: '20px 0'
      }}>
        <div style={{ textAlign: 'center', padding: '0 20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>MedFlow</h1>
          <div style={{
            padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: '0.9rem', opacity: '0.8' }}>Médecin</div>
          </div>
        </div>

        <nav>
          {['dashboard', 'appointments', 'patients', 'prescriptions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              style={{
                width: '100%',
                padding: '15px 20px',
                backgroundColor: activeSection === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'white',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '1rem',
                borderLeft: activeSection === tab ? '4px solid #10b981' : '4px solid transparent'
              }}
            >
              {tab === 'dashboard' && ' Tableau de bord'}
              {tab === 'appointments' && ' Mes Rendez-vous'}
              {tab === 'patients' && ' Mes Patients'}
              {tab === 'prescriptions' && ' Prescriptions'}
            </button>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '20px', width: '250px', padding: '0 20px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
             Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>
        {activeSection === 'dashboard' && renderDoctorDashboard()}
        {activeSection === 'appointments' && renderAppointments()}
        {activeSection === 'patients' && renderPatients()}
        {activeSection === 'prescriptions' && renderPrescriptions()}
      </div>
      {consultationOpenFor && <ConsultationForm appointment={consultationOpenFor} onClose={() => setConsultationOpenFor(null)} />}
    </div>
  );
}
