import { useState, useEffect } from 'react';
import { getNominations, approveNomination, rejectNomination, getElections } from '../services/api';
import '../App.css';

function Nominations() {
  const [nominations, setNominations] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterElection, setFilterElection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadNominations();
  }, [filterElection, filterStatus]);

  const loadData = async () => {
    try {
      const [nominationsRes, electionsRes] = await Promise.all([
        getNominations(),
        getElections()
      ]);
      setNominations(nominationsRes.data);
      setElections(electionsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadNominations = async () => {
    try {
      const response = await getNominations(filterElection || undefined, filterStatus || undefined);
      setNominations(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل الترشيحات');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveNomination(id);
      setSuccess('تم اعتماد الترشيح بنجاح!');
      loadNominations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل اعتماد الترشيح');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في رفض هذا الترشيح؟')) return;

    try {
      await rejectNomination(id);
      setSuccess('تم رفض الترشيح بنجاح!');
      loadNominations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض الترشيح');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'معلق',
      'approved': 'معتمد',
      'rejected': 'مرفوض'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="loading">جاري تحميل الترشيحات...</div>;
  }

  const filteredNominations = nominations.filter(nom => {
    if (filterElection && nom.electionId?._id !== filterElection) return false;
    if (filterStatus && nom.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">الترشيحات</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="filters-row">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">تصفية حسب الانتخابات</label>
            <select
              className="form-select"
              value={filterElection}
              onChange={(e) => setFilterElection(e.target.value)}
            >
              <option value="">جميع الانتخابات</option>
              {elections.map(election => (
                <option key={election._id} value={election._id}>
                  {election.buildingId?.number} - {election.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">تصفية حسب الحالة</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        {filteredNominations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>لا توجد ترشيحات.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {filteredNominations.map(nomination => (
              <div key={nomination._id} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3>{nomination.residentId?.fullName}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      الوحدة {nomination.residentId?.unit}
                    </p>
                  </div>
                  <span className={`badge badge-${nomination.status === 'approved' ? 'success' : nomination.status === 'rejected' ? 'danger' : 'warning'}`}>
                    {getStatusText(nomination.status)}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>الانتخابات:</strong> {nomination.electionId?.title}</p>
                  <p><strong>العماره:</strong> {nomination.electionId?.buildingId?.number}</p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>البيان:</strong></p>
                  <p style={{ color: '#4b5563' }}>{nomination.statement}</p>
                </div>
                {nomination.qualifications && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p><strong>المؤهلات:</strong></p>
                    <p style={{ color: '#4b5563' }}>{nomination.qualifications}</p>
                  </div>
                )}
                {nomination.goals && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p><strong>الأهداف:</strong></p>
                    <p style={{ color: '#4b5563' }}>{nomination.goals}</p>
                  </div>
                )}
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  تم الإرسال: {new Date(nomination.submittedAt).toLocaleString('ar-EG')}
                </p>
                {nomination.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-success btn-small" onClick={() => handleApprove(nomination._id)}>
                      اعتماد
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => handleReject(nomination._id)}>
                      رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Nominations;
