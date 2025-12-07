import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentService, userService, consultationService, prescriptionService, paymentService } from './services/api';

export default function Receptionist() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientConsultations, setPatientConsultations] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [patientViewMode, setPatientViewMode] = useState('consultations'); // 'consultations' | 'prescriptions'
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderReceptionistDashboard = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '1.8rem' }}>Tableau de bord réceptionniste</h1>
      <p style={{ color: '#718096', marginBottom: '30px' }}>Bienvenue, {user?.firstName} {user?.lastName}</p>
      
      {/* Cartes statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '2rem', marginRight: '15px' }}>??</span>
            <div>
              <h3 style={{ margin: '0', color: '#ff9800', fontSize: '0.9rem', fontWeight: '600' }}>RDV PROGRAMMÉS</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{appointments.length}</div>
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #4caf50'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '2rem', marginRight: '15px' }}>??</span>
            <div>
              <h3 style={{ margin: '0', color: '#4caf50', fontSize: '0.9rem', fontWeight: '600' }}>PATIENTS EN ATTENTE</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3748' }}>{new Set(appointments.filter(a => a.status === 'pending').map(a => a.patient?.id)).size}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Section agenda du jour (affiché seulement si des rendez-vous existent) */}
      {appointments.length > 0 && (
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Planning du jour</h2>
          {/* Simple listing des rendez-vous du state */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
              {appointments.map(appt => (
                <li key={appt.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{appt.patient?.firstName} {appt.patient?.lastName}</strong> — {new Date(appt.appointment_datetime).toLocaleString('fr-FR')}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ marginRight: '8px', fontSize: '0.9rem', color: appt.paid ? '#10b981' : '#64748b', fontWeight: 700 }}>
                      {appt.paid ? 'Payé' : 'Non payé'}
                    </div>
                    <button onClick={async () => { await handleOpenPatientConsultations(appt.patient); }} style={{ padding: '6px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>Consultations</button>
                    <button onClick={async () => { await handleOpenPatientPrescriptions(appt.patient); }} style={{ padding: '6px 8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px' }}>Ordonnances</button>
                    {!appt.paid && (
                      <button onClick={async () => { await handleCreatePayment(appt); }} style={{ padding: '6px 8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>Facturer</button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    // Charger rendez-vous et utilisateurs au montage
    fetchAppointments();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to server-sent events for real-time updates
  useEffect(() => {
    const base = '${API_BASE_URL}';
    const es = new EventSource(`${base}/notifications/stream`);

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        // react to relevant events
        if (payload && (payload.type === 'payment_succeeded' || payload.type === 'appointment_status_updated')) {
          fetchAppointments();
        }
      } catch (err) {
        console.warn('Failed to parse SSE message', err);
      }
    };

    es.onerror = (err) => {
      console.warn('SSE connection error', err);
      // keep the connection open handling to the browser; close and let it try reconnect
      es.close();
    };

    return () => {
      try { es.close(); } catch (e) { /* noop */ }
    };
    // run once on mount
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await userService.getAll();
      setPatients(allUsers.filter(u => u.role === 'patient'));
      setDoctors(allUsers.filter(u => u.role === 'doctor'));
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleOpenPatient = async (patient) => {
    setSelectedPatient(patient);
    setActiveSection('patientView');
  };

  const handleOpenPatientConsultations = async (patient) => {
    setSelectedPatient(patient);
    setActiveSection('patientView');
    setPatientViewMode('consultations');
    setPatientPrescriptions([]);
    setLoadingPatientData(true);
    try {
      const data = await consultationService.getByPatientId(patient.id);
      setPatientConsultations(data || []);
    } catch (err) {
      console.error('Erreur fetching patient consultations', err);
      setPatientConsultations([]);
    } finally {
      setLoadingPatientData(false);
    }
  };

  const handleOpenPatientPrescriptions = async (patient) => {
    setSelectedPatient(patient);
    setActiveSection('patientView');
    setPatientViewMode('prescriptions');
    setPatientConsultations([]);
    setLoadingPatientData(true);
    try {
      const data = await prescriptionService.getByPatientId(patient.id);
      setPatientPrescriptions(data || []);
    } catch (err) {
      console.error('Erreur fetching patient prescriptions', err);
      setPatientPrescriptions([]);
    } finally {
      setLoadingPatientData(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.create({
        ...formData,
        appointment_datetime: `${formData.appointment_date}T${formData.appointment_time}`
      });
      setShowCreateForm(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        notes: ''
      });
      fetchAppointments();
      alert('Rendez-vous créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      alert('Erreur lors de la création du rendez-vous');
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await appointmentService.delete(id);
        fetchAppointments();
        alert('Rendez-vous supprimé avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleCreatePayment = async (appt) => {
    try {
      // determine amount: if appointment has doctor with consultationFee use it, otherwise ask
      const amount = appt.doctor?.consultationFee || appt.amount || 20; // default 20
      const res = await paymentService.createCheckoutSession(appt.id, amount, 'eur');
      if (res && res.url) {
        window.open(res.url, '_blank');
        // after payment completes webhook will mark appointment as paid; refresh shortly and let polling continue
        setTimeout(() => {
          fetchAppointments();
        }, 5000);
      } else {
        alert('Impossible de créer la session de paiement');
      }
    } catch (err) {
      console.error('Erreur création paiement', err);
      alert('Erreur lors de la création du paiement');
    }
  };

  // Helper: compute a sensible amount for an appointment
  const getAppointmentAmount = (appt) => {
    if (!appt) return null;
    // explicit amount field
    if (appt.amount !== undefined && appt.amount !== null && !isNaN(Number(appt.amount))) return Number(appt.amount);
    // if payment object exists (backend may store payments separately)
    if (appt.payment && appt.payment.amount !== undefined && appt.payment.amount !== null) return Number(appt.payment.amount);
    // fallback to doctor's consultation fee
    if (appt.doctor && appt.doctor.consultationFee !== undefined && appt.doctor.consultationFee !== null) return Number(appt.doctor.consultationFee);
    return null;
  };

  const renderAppointments = () => {
    // Charger les données si pas encore fait
    if (appointments.length === 0 && !loading) {
      fetchAppointments();
      fetchUsers();
    }

    return (
      <div style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0', color: '#2d3748' }}>Gestion des rendez-vous</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {showCreateForm ? 'Annuler' : '+ Nouveau rendez-vous'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateAppointment} style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: '0', color: '#2d3748' }}>Créer un nouveau rendez-vous</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Patient
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Docteur
                </label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Sélectionner un docteur</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Heure
                </label>
                <input
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                  required
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

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Motif de la consultation
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="Ex: Consultation générale, contrôle..."
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
                placeholder="Notes supplémentaires..."
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                type="submit"
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Créer le rendez-vous
              </button>
            </div>
          </form>
        )}

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '20px 30px',
            borderBottom: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0', color: '#2d3748' }}>
              Liste des rendez-vous ({appointments.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p>Chargement...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#718096' }}>Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              {appointments.map(appointment => (
                <div key={appointment.id} style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>??</span>
                      <div>
                        <strong style={{ color: '#2d3748' }}>
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </strong>
                        <span style={{ color: '#718096', marginLeft: '10px' }}>
                          avec Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                      ?? {new Date(appointment.appointment_datetime).toLocaleDateString('fr-FR')} à {new Date(appointment.appointment_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.9rem', marginTop: '5px' }}>
                      ?? {appointment.reason}
                    </div>
                    {appointment.notes && (
                      <div style={{ color: '#718096', fontSize: '0.9rem', marginTop: '5px' }}>
                        ?? {appointment.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPatients = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Accueil des patients</h1>
      <p>Section d'accueil des patients en développement...</p>
    </div>
  );

  const renderDoctors = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Planning des médecins</h1>
      <p>Section de planning des médecins en développement...</p>
    </div>
  );

  const renderFiles = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 30px 0', color: '#2d3748' }}>Dossiers patients</h1>
      <p>Section des dossiers patients en développement...</p>
    </div>
  );

  const renderPatientView = () => (
    <div style={{ padding: '30px' }}>
      <h1 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>{selectedPatient?.firstName} {selectedPatient?.lastName}</h1>
      <div style={{ marginBottom: '15px', color: '#64748b' }}>
        <div><strong>Email:</strong> {selectedPatient?.email || '—'}</div>
        <div><strong>Téléphone:</strong> {selectedPatient?.phone || '—'}</div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {patientViewMode === 'consultations' && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>Consultations</h3>
            {loadingPatientData ? <p>Chargement...</p> : (
              patientConsultations.length === 0 ? <p>Aucune consultation trouvée.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {patientConsultations.map(c => (
                    <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 700 }}>{c.doctor?.firstName} {c.doctor?.lastName}</div>
                      <div style={{ color: '#64748b' }}>{new Date(c.createdAt).toLocaleString('fr-FR')} — {c.diagnosis || '—'}</div>
                      {c.notes && <div style={{ marginTop: '6px' }}>{c.notes}</div>}
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        )}

        {patientViewMode === 'prescriptions' && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>Ordonnances</h3>
            {loadingPatientData ? <p>Chargement...</p> : (
              patientPrescriptions.length === 0 ? <p>Aucune ordonnance trouvée.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {patientPrescriptions.map(p => (
                    <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 700 }}>{p.doctor?.firstName} {p.doctor?.lastName}</div>
                      <div style={{ color: '#64748b' }}>{new Date(p.createdAt).toLocaleString('fr-FR')} — {p.medication}</div>
                      <div style={{ marginTop: '6px' }}>{p.dosage}</div>
                      <div style={{ marginTop: '6px' }}>
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
                        }} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>Télécharger PDF</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );

  // --- Factures (invoices) state and renderer (moved inside component) ---
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  const openInvoiceDetail = (appt) => {
    setSelectedInvoice(appt);
    setShowInvoiceDetail(true);
  };

  const renderInvoices = () => {
    const paidAppointments = appointments.filter(a => a.paid);

    const paidCount = paidAppointments.length;
    const totalAmount = paidAppointments.reduce((sum, a) => {
      const val = getAppointmentAmount(a);
      return sum + (val !== null ? Number(val) : 0);
    }, 0);

    return (
      <div style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ margin: '0', color: '#2d3748' }}>Factures — Payées</h1>
        </div>
        <div style={{ marginBottom: '18px', color: '#64748b' }}>
          <strong style={{ color: '#2d3748' }}>{paidCount}</strong> factures payées — Total : <strong style={{ color: '#10b981' }}>{totalAmount.toFixed(2)} €</strong>
        </div>

        {paidAppointments.length === 0 ? (
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#718096' }}>Aucune facture payée pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {paidAppointments.map(appt => (
              <div key={appt.id} style={{ background: 'white', padding: '18px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#2d3748' }}>{appt.patient?.firstName} {appt.patient?.lastName}</div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(appt.appointment_datetime).toLocaleString('fr-FR')}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>{(() => { const a = getAppointmentAmount(appt); return a !== null ? `${a} €` : '—'; })()}</div>
                  <button onClick={() => openInvoiceDetail(appt)} style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Voir détail</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showInvoiceDetail && selectedInvoice && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowInvoiceDetail(false)}>
            <div style={{ width: '720px', background: 'white', borderRadius: '12px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Détail de la facture</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong>Patient</strong><div>{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</div></div>
                <div><strong>Docteur</strong><div>Dr. {selectedInvoice.doctor?.firstName} {selectedInvoice.doctor?.lastName}</div></div>
                <div><strong>Date</strong><div>{new Date(selectedInvoice.appointment_datetime).toLocaleString('fr-FR')}</div></div>
                <div><strong>Montant</strong><div>{(() => { const a = getAppointmentAmount(selectedInvoice); return a !== null ? `${a} €` : '—'; })()}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Méthode de paiement</strong><div>{selectedInvoice.paymentMethod || 'Stripe / Web'}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Notes</strong><div>{selectedInvoice.notes || '—'}</div></div>
              </div>
              <div style={{ marginTop: '18px', textAlign: 'right' }}>
                <button onClick={() => setShowInvoiceDetail(false)} style={{ padding: '10px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px' }}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: 'linear-gradient(180deg, #1976d2 0%, #2196f3 100%)',
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
            ?? MedFlow
          </div>
          <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>
            Espace Réceptionniste
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {[
              { id: 'dashboard', label: 'Tableau de bord', icon: '??' },
              { id: 'appointments', label: 'Rendez-vous', icon: '??' },
              { id: 'invoices', label: 'Factures', icon: '??' }
            ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%',
                padding: '18px 25px',
                background: activeSection === item.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: 'none',
                borderLeft: activeSection === item.id ? '4px solid #03a9f4' : '4px solid transparent',
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
              Réceptionniste
            </div>
            {user?.department && (
              <div style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                Service: {user?.department}
              </div>
            )}
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
            ?? Se déconnecter
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
            {activeSection === 'dashboard' && '?? Tableau de bord'}
            {activeSection === 'appointments' && '?? Gestion des rendez-vous'}
            {activeSection === 'patientView' && selectedPatient && `?? ${selectedPatient.firstName} ${selectedPatient.lastName}`}
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
          {activeSection === 'dashboard' && renderReceptionistDashboard()}
          {activeSection === 'appointments' && renderAppointments()}
          {activeSection === 'invoices' && renderInvoices()}
          {activeSection === 'patientView' && selectedPatient && renderPatientView()}
        </div>
      </div>
    </div>
  );
}

  
