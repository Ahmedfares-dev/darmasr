import { useState, useEffect } from 'react';
import { getWinners, confirmWinner, rejectWinner, getBuildings } from '../services/api';
import '../App.css';

function Winners() {
  const [winners, setWinners] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadWinners();
  }, [filterBuilding, filterStatus]);

  const loadData = async () => {
    try {
      const [winnersRes, buildingsRes] = await Promise.all([
        getWinners(),
        getBuildings()
      ]);
      setWinners(winnersRes.data);
      setBuildings(buildingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadWinners = async () => {
    try {
      const response = await getWinners(filterStatus || undefined, filterBuilding || undefined);
      setWinners(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل الفائزين');
    }
  };

  const handleConfirm = async (id) => {
    if (!window.confirm('هل أنت متأكد من تأكيد هذا الفائز؟')) return;

    try {
      // In a real app, you'd get the current user ID
      await confirmWinner(id, 'admin-user-id');
      setSuccess('تم تأكيد الفائز بنجاح!');
      loadWinners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تأكيد الفائز');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('هل أنت متأكد من رفض هذا الفائز؟')) return;

    try {
      await rejectWinner(id);
      setSuccess('تم رفض الفائز بنجاح!');
      loadWinners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض الفائز');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'في انتظار التأكيد',
      'confirmed': 'مؤكد',
      'rejected': 'مرفوض'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="loading">جاري تحميل الفائزين...</div>;
  }

  const filteredWinners = winners.filter(winner => {
    if (filterBuilding && winner.electionId?.buildingId?._id !== filterBuilding) return false;
    if (filterStatus && winner.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">الفائزون</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="filters-row">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">تصفية حسب العماره</label>
            <select
              className="form-select"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
            >
              <option value="">جميع العمارات</option>
              {buildings.map(building => (
                <option key={building._id} value={building._id}>
                  {building.number}
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
              <option value="pending">في انتظار التأكيد</option>
              <option value="confirmed">مؤكد</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        {filteredWinners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <p>لا يوجد فائزون.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {filteredWinners.map(winner => (
              <div key={winner._id} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3>🏆 {winner.nominationId?.residentId?.fullName}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      الوحدة {winner.nominationId?.residentId?.unit}
                    </p>
                  </div>
                  <span className={`badge badge-${winner.status === 'confirmed' ? 'success' : winner.status === 'rejected' ? 'danger' : 'warning'}`}>
                    {getStatusText(winner.status)}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>الانتخابات:</strong> {winner.electionId?.title}</p>
                  <p><strong>رقم الانتخابات:</strong> {winner.electionId?.number}</p>
                  <p><strong>العماره:</strong> {winner.electionId?.buildingId?.number}</p>
                  <p><strong>الأصوات المستلمة:</strong> {winner.voteCount}</p>
                </div>
                {winner.nominationId?.statement && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p><strong>البيان:</strong></p>
                    <p style={{ color: '#4b5563' }}>{winner.nominationId.statement}</p>
                  </div>
                )}
                {winner.confirmedAt && (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    تم التأكيد: {new Date(winner.confirmedAt).toLocaleString('ar-EG')}
                    {winner.confirmedBy && ` بواسطة ${winner.confirmedBy?.fullName || 'المسؤول'}`}
                  </p>
                )}
                {winner.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-success btn-small" onClick={() => handleConfirm(winner._id)}>
                      تأكيد الفائز
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => handleReject(winner._id)}>
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

export default Winners;
