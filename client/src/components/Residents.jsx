import { useState, useEffect } from 'react';
import { getResidents, createResident, updateResident, deleteResident, getBuildings, getUploadPresign, approveUser, rejectUser } from '../services/api';
import '../App.css';

function Residents() {
  const [residents, setResidents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [formData, setFormData] = useState({
    buildingId: '',
    fullName: '',
    unit: '',
    phone: '',
    idDocument: '',
    ownerType: '',
    idCardImage: '',
    ownershipProof: ''
  });
  const [uploading, setUploading] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadResidents();
  }, [filterBuilding]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [residentsRes, buildingsRes] = await Promise.all([
        getResidents(),
        getBuildings()
      ]);
      setResidents(residentsRes.data);
      setBuildings(buildingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadResidents = async () => {
    try {
      const response = await getResidents(filterBuilding || undefined);
      setResidents(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل السكان');
    }
  };

  // Convert Arabic numerals to regular numerals
  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    const arabicToRegular = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    // Convert Arabic numerals to regular numerals and remove spaces/dashes
    return phone
      .toString()
      .split('')
      .map(char => arabicToRegular[char] || char)
      .join('')
      .replace(/[\s-]/g, '');
  };

  const validateEgyptianPhone = (phone) => {
    // Normalize Arabic numerals first
    const cleaned = normalizePhoneNumber(phone);
    // Egyptian phone number patterns:
    // Mobile: 01X XXXX XXXX (11 digits starting with 01)
    // Landline: 02 XXXX XXXX (10 digits starting with 02)
    // With country code: +20 1X XXXX XXXX or +20 2X XXXX XXXX
    const mobilePattern = /^01[0-2,5]{1}[0-9]{8}$/;
    const landlinePattern = /^02[0-9]{8}$/;
    const countryCodeMobilePattern = /^\+201[0-2,5]{1}[0-9]{8}$/;
    const countryCodeLandlinePattern = /^\+202[0-9]{8}$/;
    
    return mobilePattern.test(cleaned) || 
           landlinePattern.test(cleaned) || 
           countryCodeMobilePattern.test(cleaned) || 
           countryCodeLandlinePattern.test(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    if (!validateEgyptianPhone(formData.phone)) {
      setError('رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)');
      return;
    }

    try {
      // Normalize phone number (convert Arabic numerals to regular) before sending
      const normalizedFormData = {
        ...formData,
        phone: normalizePhoneNumber(formData.phone)
      };
      if (editingResident) {
        await updateResident(editingResident._id, normalizedFormData);
      } else {
        await createResident(normalizedFormData);
      }
      setShowModal(false);
      setEditingResident(null);
      setFormData({
        buildingId: '',
        fullName: '',
        unit: '',
        phone: '',
        idDocument: '',
        ownerType: '',
        idCardImage: '',
        ownershipProof: ''
      });
      loadResidents();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل حفظ الساكن');
    }
  };

  const handleEdit = (resident) => {
    setEditingResident(resident);
    setFormData({
      buildingId: resident.buildingId._id || resident.buildingId,
      fullName: resident.fullName,
      unit: resident.unit,
      phone: resident.phone,
      idDocument: resident.idDocument || '',
      ownerType: resident.ownerType || '',
      idCardImage: resident.idCardImage || '',
      ownershipProof: resident.ownershipProof || ''
    });
    setShowModal(true);
  };

  const uploadFile = async (file, prefix) => {
    setUploading(true);
    setError('');
    setUploadSuccess('');
    try {
      const key = `${prefix}/${Date.now()}-${file.name}`;
      
      // Get presigned URL
      let presignResponse;
      try {
        presignResponse = await getUploadPresign(key, file.type);
      } catch (err) {
        console.error('Error getting presigned URL:', err);
        throw new Error(err.response?.data?.error || 'فشل في الحصول على رابط الرفع');
      }
      
      const { data } = presignResponse;
      if (!data || !data.url) {
        throw new Error('رابط الرفع غير صالح');
      }
      
      // Upload file to S3 using presigned URL
      const response = await fetch(data.url, {
        method: 'PUT',
        headers: { 
          'Content-Type': file.type,
        },
        body: file,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: data.url.substring(0, 100) + '...'
        });
        throw new Error(`فشل رفع الملف: ${response.status} ${response.statusText}`);
      }
      
      // Use the public URL from the response, or construct it from presigned URL
      const cleanUrl = data.publicUrl || data.url.split('?')[0];
      const fileTypeName = prefix === 'id-cards' ? 'صورة البطاقة' : 'الإيصال';
      setUploadSuccess(`تم رفع ${fileTypeName} بنجاح`);
      setTimeout(() => setUploadSuccess(''), 3000);
      return cleanUrl;
    } catch (err) {
      console.error('Upload error:', err);
      const fileTypeName = prefix === 'id-cards' ? 'صورة البطاقة' : 'الإيصال';
      const errorMessage = err.message || `فشل رفع ${fileTypeName}`;
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الساكن؟')) return;

    try {
      await deleteResident(id);
      loadResidents();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل حذف الساكن');
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
      loadResidents();
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
      loadResidents();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض المستخدم');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">جاري تحميل السكان...</div>;
  }

  const filteredResidents = residents.filter(resident => {
    // Filter by building
    if (filterBuilding) {
      const buildingId = resident.buildingId?._id || resident.buildingId;
      if (buildingId !== filterBuilding) {
        return false;
      }
    }
    
    // Filter by active status
    if (filterActive !== '') {
      const isActive = filterActive === 'true';
      if (resident.isActive !== isActive) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">السكان</h2>
          <button className="btn btn-primary" onClick={() => {
            setEditingResident(null);
            setFormData({
              buildingId: '',
              fullName: '',
              unit: '',
              phone: '',
              idDocument: ''
            });
            setShowModal(true);
          }}>
            + إضافة ساكن
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="filters-row" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
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
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label className="form-label">تصفية حسب الحالة</label>
            <select
              className="form-select"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="">جميع الحالات</option>
              <option value="true">✅ معتمد</option>
              <option value="false">⏳ في انتظار الموافقة</option>
            </select>
          </div>
        </div>

        {filteredResidents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>لا يوجد سكان. أضف أول ساكن!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>العماره</th>
                  <th>الوحدة</th>
                  <th>نوع الملكية</th>
                <th>الهاتف</th>
                <th>حالة المستندات</th>
                <th>صورة البطاقة</th>
                <th>إيصال ملكية/إيجار</th>
                  <th>رقم الهوية</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map(resident => (
                  <tr key={resident._id}>
                    <td>{resident.fullName}</td>
                    <td>{resident.buildingId?.number || 'غير متاح'}</td>
                    <td>{resident.unit}</td>
                    <td>
                      <span className={`badge badge-${resident.ownerType === 'owner' ? 'success' : 'info'}`}>
                        {resident.ownerType === 'owner' ? 'مالك' : resident.ownerType === 'rental' ? 'مستأجر' : '-'}
                      </span>
                    </td>
                    <td>{resident.phone}</td>
                  <td>
                    <span className={`badge badge-${resident.isActive ? 'success' : 'warning'}`}>
                      {resident.isActive ? '✅ معتمد' : '⏳ في انتظار الموافقة'}
                    </span>
                  </td>
                  <td>
                    {resident.idCardImage ? (
                      <a className="btn btn-secondary btn-small" href={resident.idCardImage} target="_blank" rel="noreferrer">
                        عرض
                      </a>
                    ) : (
                      <span className="badge badge-warning">غير مرفق</span>
                    )}
                  </td>
                  <td>
                    {resident.ownershipProof ? (
                      <a className="btn btn-secondary btn-small" href={resident.ownershipProof} target="_blank" rel="noreferrer">
                        عرض
                      </a>
                    ) : (
                      <span className="badge badge-warning">غير مرفق</span>
                    )}
                  </td>
                    <td>{resident.idDocument || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-info btn-small" 
                          onClick={() => setShowAttachmentsModal(resident)}
                          title="عرض المرفقات"
                        >
                          📄 المرفقات
                        </button>
                        {!resident.isActive && (
                          <>
                            <button
                              className="btn btn-success btn-small"
                              onClick={() => handleApprove(resident._id)}
                              disabled={processingId === resident._id}
                            >
                              {processingId === resident._id ? '⏳' : '✅'} موافقة
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => setShowRejectModal(resident._id)}
                              disabled={processingId === resident._id}
                            >
                              ❌ رفض
                            </button>
                          </>
                        )}
                        <button className="btn btn-secondary btn-small" onClick={() => handleEdit(resident)}>
                          تعديل
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(resident._id)}>
                          حذف
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

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingResident ? 'تعديل الساكن' : 'إضافة ساكن'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {uploadSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{uploadSuccess}</div>}
              <div className="form-group">
                <label className="form-label">العماره *</label>
                <select
                  className="form-select"
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  required
                >
                  <option value="">اختر العماره</option>
                  {buildings.map(building => (
                    <option key={building._id} value={building._id}>
                      {building.number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الاسم الكامل *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الوحدة *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">نوع الملكية *</label>
                <select
                  className="form-select"
                  value={formData.ownerType}
                  onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                  required
                >
                  <option value="">اختر نوع الملكية</option>
                  <option value="owner">مالك</option>
                  <option value="rental">مستأجر</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الهاتف *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="01X XXXX XXXX أو 02 XXXX XXXX (يدعم الأرقام العربية)"
                  inputMode="numeric"
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                  مثال: 01012345678 أو ٠١٠١٢٣٤٥٦٧٨ أو 0212345678
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">رقم الهوية</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.idDocument}
                  onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">صورة البطاقة (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadFile(file, 'id-cards');
                      setFormData({ ...formData, idCardImage: url });
                    } catch (err) {
                      // Error is already set in uploadFile
                    }
                  }}
                />
                {uploading && <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>جاري الرفع...</div>}
                {formData.idCardImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={formData.idCardImage} target="_blank" rel="noreferrer" className="btn btn-secondary btn-small">
                      عرض الصورة
                    </a>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">إيصال الملكية/الإيجار (اختياري)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="form-input"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadFile(file, 'ownership');
                      setFormData({ ...formData, ownershipProof: url });
                    } catch (err) {
                      // Error is already set in uploadFile
                    }
                  }}
                />
                {uploading && <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>جاري الرفع...</div>}
                {formData.ownershipProof && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={formData.ownershipProof} target="_blank" rel="noreferrer" className="btn btn-secondary btn-small">
                      عرض الإيصال
                    </a>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">رابط صورة البطاقة (اختياري)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.idCardImage}
                  onChange={(e) => setFormData({ ...formData, idCardImage: e.target.value })}
                  placeholder="مثال: https://example.com/id.jpg"
                />
              </div>
              <div className="form-group">
                <label className="form-label">رابط إيصال الملكية/الإيجار (اختياري)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.ownershipProof}
                  onChange={(e) => setFormData({ ...formData, ownershipProof: e.target.value })}
                  placeholder="مثال: https://example.com/proof.jpg"
                />
              </div>
              <div className="form-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingResident ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachments Modal */}
      {showAttachmentsModal && (
        <div className="modal" onClick={() => setShowAttachmentsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%' }}>
            <div className="modal-header">
              <h3 className="modal-title">مرفقات {showAttachmentsModal.fullName}</h3>
              <button className="close-btn" onClick={() => setShowAttachmentsModal(null)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem' 
              }}>
                {/* ID Card */}
                <div style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: '#6b7280', 
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}>
                    صورة البطاقة الشخصية
                  </label>
                  
                  {showAttachmentsModal.idCardImage ? (
                    <div>
                      <a 
                        href={showAttachmentsModal.idCardImage} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary"
                        style={{ width: '100%', textAlign: 'center', marginBottom: '1rem' }}
                      >
                        📄 عرض صورة البطاقة
                      </a>
                      <img 
                        src={showAttachmentsModal.idCardImage} 
                        alt="ID Card" 
                        style={{ 
                          width: '100%', 
                          maxHeight: '300px', 
                          objectFit: 'contain',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          background: '#fff'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '2rem', 
                      textAlign: 'center',
                      background: '#fff',
                      borderRadius: '0.5rem',
                      border: '2px dashed #d1d5db',
                      color: '#9ca3af'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                      <div style={{ fontSize: '0.875rem' }}>لا توجد صورة للبطاقة</div>
                    </div>
                  )}
                </div>

                {/* Ownership Proof */}
                <div style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    color: '#6b7280', 
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}>
                    إيصال الملكية/الإيجار
                  </label>
                  
                  {showAttachmentsModal.ownershipProof ? (
                    <div>
                      <a 
                        href={showAttachmentsModal.ownershipProof} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary"
                        style={{ width: '100%', textAlign: 'center', marginBottom: '1rem' }}
                      >
                        📄 عرض الإيصال
                      </a>
                      <img 
                        src={showAttachmentsModal.ownershipProof} 
                        alt="Ownership Proof" 
                        style={{ 
                          width: '100%', 
                          maxHeight: '300px', 
                          objectFit: 'contain',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          background: '#fff'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '2rem', 
                      textAlign: 'center',
                      background: '#fff',
                      borderRadius: '0.5rem',
                      border: '2px dashed #d1d5db',
                      color: '#9ca3af'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                      <div style={{ fontSize: '0.875rem' }}>لا يوجد إيصال</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

export default Residents;
