import { useState, useEffect } from 'react';
import { getBuildings, approveUser, rejectUser } from '../services/api';
import api from '../services/api';
import '../App.css';

function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [residents, setResidents] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const response = await getBuildings();
      setBuildings(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل العمارات');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('هل أنت متأكد من إنشاء 56 مبنى؟ سيتم إنشاء المباني المرقمة من 1 إلى 56.')) return;

    try {
      setSeeding(true);
      setError('');
      await api.post('/buildings/seed');
      alert('تم إنشاء 56 مبنى بنجاح!');
      loadBuildings();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إنشاء العمارات');
    } finally {
      setSeeding(false);
    }
  };

  const handleBuildingClick = async (building) => {
    try {
      setLoadingResidents(true);
      setSelectedBuilding(building);
      const response = await api.get(`/auth/building/${building._id}`);
      setResidents(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل السكان');
      setResidents([]);
    } finally {
      setLoadingResidents(false);
    }
  };

  const handleCloseResidents = () => {
    setSelectedBuilding(null);
    setResidents([]);
    setShowRejectModal(null);
    setRejectReason('');
    setError('');
    setSuccess('');
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا المستخدم؟')) return;

    try {
      setProcessingId(userId);
      setError('');
      setSuccess('');
      await approveUser(userId);
      setSuccess('تم الموافقة على المستخدم بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      // Reload residents
      if (selectedBuilding) {
        const response = await api.get(`/auth/building/${selectedBuilding._id}`);
        setResidents(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الموافقة على المستخدم');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason || rejectReason.trim().length < 3) {
      setError('يرجى إدخال سبب الرفض (3 أحرف على الأقل)');
      return;
    }

    if (!window.confirm('هل أنت متأكد من رفض هذا المستخدم؟ سيتم حذف حسابه.')) return;

    try {
      setProcessingId(userId);
      setError('');
      setSuccess('');
      await rejectUser(userId, rejectReason);
      setSuccess('تم رفض المستخدم بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      setRejectReason('');
      setShowRejectModal(null);
      // Reload residents
      if (selectedBuilding) {
        const response = await api.get(`/auth/building/${selectedBuilding._id}`);
        setResidents(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض المستخدم');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">جاري تحميل المباني...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">العمارات</h2>
          {buildings.length === 0 && (
            <button 
              className="btn btn-primary" 
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? 'جاري الإنشاء...' : 'إنشاء 56 مبنى'}
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {buildings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p>لا توجد عمارات. قم بإنشاء 56 عماره!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>عدد السكان</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map(building => (
                  <tr 
                    key={building._id}
                    onClick={() => handleBuildingClick(building)}
                    style={{ cursor: 'pointer' }}
                    className={selectedBuilding?._id === building._id ? 'table-row-selected' : ''}
                  >
                    <td>{building.number}</td>
                    <td>{building.residentCount || 0}</td>
                    <td>
                      <span className={`badge badge-${building.status === 'active' ? 'success' : 'danger'}`}>
                        {building.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBuilding && (
        <div className="modal" onClick={handleCloseResidents}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%' }}>
            <div className="modal-header">
              <h3 className="modal-title">سكان العماره رقم {selectedBuilding.number}</h3>
              <button className="close-btn" onClick={handleCloseResidents}>×</button>
            </div>

            {loadingResidents ? (
              <div className="loading" style={{ padding: '2rem' }}>جاري تحميل السكان...</div>
            ) : residents.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">👤</div>
                <p>لا يوجد سكان في هذه العماره</p>
              </div>
            ) : (
              <>
                {error && <div className="alert alert-error" style={{ margin: '1rem' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ margin: '1rem' }}>{success}</div>}
                <div className="table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <table className="table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الشقة</th>
                    <th>رقم الهاتف</th>
                    <th>نوع الملكية</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                  <tbody>
                    {residents.map(resident => (
                      <tr key={resident._id}>
                        <td>{resident.fullName}</td>
                        <td>{resident.unit}</td>
                        <td>{resident.phone}</td>
                        <td>
                          <span className={`badge badge-${resident.ownerType === 'owner' ? 'success' : 'info'}`}>
                            {resident.ownerType === 'owner' ? 'مالك' : 'مستأجر'}
                          </span>
                        </td>
                        <td>
                          {!resident.isActive ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-success btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(resident._id);
                                }}
                                disabled={processingId === resident._id}
                              >
                                {processingId === resident._id ? '⏳' : '✅'} موافقة
                              </button>
                              <button
                                className="btn btn-danger btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRejectModal(resident._id);
                                }}
                                disabled={processingId === resident._id}
                              >
                                ❌ رفض
                              </button>
                            </div>
                          ) : (
                            <span className="badge badge-success">✅ معتمد</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal" onClick={() => {
          setShowRejectModal(null);
          setRejectReason('');
          setError('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">رفض المستخدم</h3>
              <button className="close-btn" onClick={() => {
                setShowRejectModal(null);
                setRejectReason('');
                setError('');
              }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">سبب الرفض *</label>
                <textarea
                  className="form-input"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="أدخل سبب رفض المستخدم..."
                  rows="4"
                  required
                />
              </div>
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectReason || rejectReason.trim().length < 3 || processingId === showRejectModal}
                >
                  {processingId === showRejectModal ? '⏳ جاري الرفض...' : 'رفض المستخدم'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                    setError('');
                  }}
                  disabled={processingId === showRejectModal}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buildings;
