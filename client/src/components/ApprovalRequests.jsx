import { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '../services/api';
import '../App.css';

function ApprovalRequests() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPendingUsers();
      setPendingUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل طلبات الموافقة');
    } finally {
      setLoading(false);
    }
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
      loadPendingUsers();
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
      loadPendingUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض المستخدم');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">جاري تحميل طلبات الموافقة...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">طلبات الموافقة على المستخدمين</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {pendingUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p>لا توجد طلبات موافقة معلقة</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الهاتف</th>
                  <th>العماره</th>
                  <th>الشقة</th>
                  <th>نوع الملكية</th>
                  <th>المستندات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.fullName}</td>
                    <td>{user.phone}</td>
                    <td>{user.buildingId?.number || 'غير محدد'}</td>
                    <td>{user.unit}</td>
                    <td>
                      <span className={`badge badge-${user.ownerType === 'owner' ? 'success' : 'info'}`}>
                        {user.ownerType === 'owner' ? 'مالك' : 'مستأجر'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {user.idCardImage ? (
                          <a 
                            href={user.idCardImage} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-secondary btn-small"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            📄 البطاقة
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>❌</span>
                        )}
                        {user.ownershipProof ? (
                          <a 
                            href={user.ownershipProof} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-secondary btn-small"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            📄 الإيصال
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>❌</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleApprove(user._id)}
                          disabled={processingId === user._id}
                        >
                          {processingId === user._id ? '⏳' : '✅'} موافقة
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => setShowRejectModal(user._id)}
                          disabled={processingId === user._id}
                        >
                          ❌ رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default ApprovalRequests;
