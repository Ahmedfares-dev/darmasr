import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, getBuildings, getUploadPresign, updateProfile } from '../services/api';
import '../App.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ fullName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const idCardInputRef = useRef(null);
  const ownershipProofInputRef = useRef(null);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [uploadingOwnershipProof, setUploadingOwnershipProof] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userRes, buildingsRes] = await Promise.all([
        getCurrentUser(),
        getBuildings()
      ]);
      
      const userData = userRes.data.user;
      setUser(userData);
      setEditData({ fullName: userData.fullName || '' });
      
      // Find building info
      if (userData.buildingId) {
        const buildingId = userData.buildingId._id || userData.buildingId;
        const foundBuilding = buildingsRes.data.find(b => b._id === buildingId);
        setBuilding(foundBuilding);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file, prefix) => {
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const key = `${prefix}/${Date.now()}-${file.name}`;
      
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
        });
        throw new Error(`فشل رفع الملف: ${response.status} ${response.statusText}`);
      }
      
      const cleanUrl = data.publicUrl || data.url.split('?')[0];
      return cleanUrl;
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'فشل رفع الملف';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      // Upload the new profile picture
      const url = await uploadFile(file, 'profile-pics');
      
      // Update user profile with new picture
      setUpdating(true);
      const response = await updateProfile({ profilePic: url });
      
      // Update local state
      setUser({ ...user, profilePic: url });
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.profilePic = url;
      localStorage.setItem('user', JSON.stringify(userData));
      
      setSuccess('تم تحديث صورة الملف الشخصي بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحديث صورة الملف الشخصي');
    } finally {
      setUploading(false);
      setUpdating(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ fullName: user.fullName || '' });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ fullName: user.fullName || '' });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!editData.fullName || editData.fullName.trim().length < 2) {
      setError('الاسم الكامل مطلوب (حرفين على الأقل)');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      const response = await updateProfile({ fullName: editData.fullName.trim() });
      
      // Update local state
      setUser({ ...user, fullName: editData.fullName.trim() });
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.fullName = editData.fullName.trim();
      localStorage.setItem('user', JSON.stringify(userData));
      
      setIsEditing(false);
      setSuccess('تم تحديث الملف الشخصي بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحديث الملف الشخصي');
    } finally {
      setUpdating(false);
    }
  };

  const handleIdCardUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingIdCard(true);
      setError('');
      setSuccess('');

      const url = await uploadFile(file, 'id-cards');
      
      setUpdating(true);
      const response = await updateProfile({ idCardImage: url });
      
      setUser({ ...user, idCardImage: url });
      
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.idCardImage = url;
      localStorage.setItem('user', JSON.stringify(userData));
      
      setSuccess('تم رفع صورة البطاقة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفع صورة البطاقة');
    } finally {
      setUploadingIdCard(false);
      setUpdating(false);
      if (idCardInputRef.current) {
        idCardInputRef.current.value = '';
      }
    }
  };

  const handleOwnershipProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingOwnershipProof(true);
      setError('');
      setSuccess('');

      const url = await uploadFile(file, 'ownership-proofs');
      
      setUpdating(true);
      const response = await updateProfile({ ownershipProof: url });
      
      setUser({ ...user, ownershipProof: url });
      
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.ownershipProof = url;
      localStorage.setItem('user', JSON.stringify(userData));
      
      setSuccess('تم رفع إيصال الملكية/الإيجار بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفع إيصال الملكية/الإيجار');
    } finally {
      setUploadingOwnershipProof(false);
      setUpdating(false);
      if (ownershipProofInputRef.current) {
        ownershipProofInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return <div className="loading">جاري تحميل الملف الشخصي...</div>;
  }

  if (error && !user) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!user) {
    return <div className="alert alert-error">لم يتم العثور على بيانات المستخدم</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card profile-card" style={{ marginBottom: '2rem' }}>
        {/* Profile Header with Picture */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="profile-header-pic" style={{
              width: 'clamp(120px, 30vw, 180px)',
              height: 'clamp(120px, 30vw, 180px)',
              borderRadius: '50%',
              border: 'clamp(4px, 1vw, 6px) solid #fff',
              overflow: 'hidden',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              {user.profilePic ? (
                <img 
                  src={user.profilePic} 
                  alt="Profile" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                  color: '#9ca3af'
                }}>
                  👤
                </div>
              )}
            </div>
            
            {/* Upload/Change Button */}
            <label
              style={{
                position: 'absolute',
                bottom: 'clamp(5px, 2vw, 10px)',
                right: 'clamp(5px, 2vw, 10px)',
                background: '#fff',
                color: '#667eea',
                border: 'none',
                borderRadius: '50%',
                width: 'clamp(36px, 10vw, 48px)',
                height: 'clamp(36px, 10vw, 48px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading || updating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!uploading && !updating) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                disabled={uploading || updating}
                style={{ display: 'none' }}
              />
              {uploading || updating ? (
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
              ) : (
                <span style={{ fontSize: '1.2rem' }}>📷</span>
              )}
            </label>
          </div>

          {(user.fullName || isEditing) && (
            <h2 style={{ 
              color: '#fff', 
              marginTop: '1rem', 
              marginBottom: '0.5rem',
              fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
              fontWeight: '600',
              wordBreak: 'break-word',
              padding: '0 0.5rem'
            }}>
              {isEditing ? editData.fullName || 'غير محدد' : user.fullName}
            </h2>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span className={`badge badge-${user.userType === 'manager' ? 'success' : 'info'}`} style={{ fontSize: '0.875rem' }}>
              {user.userType === 'manager' ? 'مدير' : 'ساكن'}
            </span>
            {user.ownerType && (
              <span className={`badge badge-${user.ownerType === 'owner' ? 'success' : 'info'}`} style={{ fontSize: '0.875rem' }}>
                {user.ownerType === 'owner' ? 'مالك' : 'مستأجر'}
              </span>
            )}
            <span className={`badge badge-${user.isActive ? 'success' : 'warning'}`} style={{ fontSize: '0.875rem' }}>
              {user.isActive ? '✅ نشط' : '⏳ في انتظار الموافقة'}
            </span>
          </div>
          
          {!user.isActive && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#ffffff', fontSize: '0.875rem' }}>
                ⏳ حسابك في انتظار موافقة المدير. سيتم تفعيل حسابك بعد مراجعة المستندات.
              </p>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '0.75rem'
          }}>
            <h3 style={{ 
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: 0
            }}>
              المعلومات الشخصية
            </h3>
            {!isEditing && (
              <button
                className="btn btn-secondary btn-small"
                onClick={handleEdit}
                disabled={updating}
                style={{ margin: 0 }}
              >
                ✏️ تعديل
              </button>
            )}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#6b7280', 
                fontWeight: '500',
                fontSize: '0.875rem'
              }}>
                الاسم الكامل
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  style={{ marginBottom: 0 }}
                />
              ) : (
                <div style={{ 
                  padding: '0.875rem', 
                  background: '#f9fafb', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#1f2937',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {user.fullName || 'غير محدد'}
                </div>
              )}
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#6b7280', 
                fontWeight: '500',
                fontSize: '0.875rem'
              }}>
                رقم الهاتف
              </label>
              <div style={{ 
                padding: '0.875rem', 
                background: '#f9fafb', 
                borderRadius: '0.5rem', 
                border: '1px solid #e5e7eb',
                fontSize: '1rem',
                color: '#1f2937'
              }}>
                {user.phone}
              </div>
            </div>

            {building && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#6b7280', 
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  العماره
                </label>
                <div style={{ 
                  padding: '0.875rem', 
                  background: '#f9fafb', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  color: '#1f2937'
                }}>
                  {building.number}
                </div>
              </div>
            )}

            {user.unit && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#6b7280', 
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  رقم الشقة
                </label>
                <div style={{ 
                  padding: '0.875rem', 
                  background: '#f9fafb', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  color: '#1f2937'
                }}>
                  {user.unit}
                </div>
              </div>
            )}
          </div>

          {/* Edit Buttons */}
          {isEditing && (
            <div style={{ 
              marginTop: '2rem', 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-start',
              flexWrap: 'wrap'
            }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={updating || !editData.fullName || editData.fullName.trim().length < 2}
              >
                {updating ? 'جاري الحفظ...' : '💾 حفظ'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={updating}
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="card">
        <div style={{ padding: '2rem' }}>
          <h3 style={{ 
            marginBottom: '1.5rem', 
            color: '#1f2937',
            fontSize: '1.25rem',
            fontWeight: '600',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '0.75rem'
          }}>
            المستندات
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
              
              {user.idCardImage ? (
                <div style={{ marginBottom: '1rem' }}>
                  <a 
                    href={user.idCardImage} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-secondary"
                    style={{ width: '100%', textAlign: 'center', marginBottom: '0.75rem' }}
                  >
                    📄 عرض صورة البطاقة
                  </a>
                  <img 
                    src={user.idCardImage} 
                    alt="ID Card" 
                    style={{ 
                      width: '100%', 
                      maxHeight: '200px', 
                      objectFit: 'contain',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      background: '#fff'
                    }}
                  />
                </div>
              ) : (
                <div style={{ 
                  marginBottom: '1rem', 
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
              
              <label
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  textAlign: 'center',
                  cursor: uploadingIdCard || updating ? 'not-allowed' : 'pointer',
                  opacity: uploadingIdCard || updating ? 0.6 : 1
                }}
              >
                <input
                  ref={idCardInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIdCardUpload}
                  disabled={uploadingIdCard || updating}
                  style={{ display: 'none' }}
                />
                {uploadingIdCard ? '⏳ جاري الرفع...' : user.idCardImage ? '🔄 تحديث صورة البطاقة' : '📤 رفع صورة البطاقة'}
              </label>
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
              
              {user.ownershipProof ? (
                <div style={{ marginBottom: '1rem' }}>
                  <a 
                    href={user.ownershipProof} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-secondary"
                    style={{ width: '100%', textAlign: 'center', marginBottom: '0.75rem' }}
                  >
                    📄 عرض الإيصال
                  </a>
                  <img 
                    src={user.ownershipProof} 
                    alt="Ownership Proof" 
                    style={{ 
                      width: '100%', 
                      maxHeight: '200px', 
                      objectFit: 'contain',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      background: '#fff'
                    }}
                  />
                </div>
              ) : (
                <div style={{ 
                  marginBottom: '1rem', 
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
              
              <label
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  textAlign: 'center',
                  cursor: uploadingOwnershipProof || updating ? 'not-allowed' : 'pointer',
                  opacity: uploadingOwnershipProof || updating ? 0.6 : 1
                }}
              >
                <input
                  ref={ownershipProofInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleOwnershipProofUpload}
                  disabled={uploadingOwnershipProof || updating}
                  style={{ display: 'none' }}
                />
                {uploadingOwnershipProof ? '⏳ جاري الرفع...' : user.ownershipProof ? '🔄 تحديث الإيصال' : '📤 رفع إيصال الملكية/الإيجار'}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
