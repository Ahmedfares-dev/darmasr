import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, getBuildings, getUploadPresign } from '../services/api';
import '../App.css';

function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1 or 2
  const [buildings, setBuildings] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    buildingId: '',
    unit: '',
    ownerType: '',
    profilePic: '',
    idCardImage: '',
    ownershipProof: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingUserInfo, setExistingUserInfo] = useState(null);

  useEffect(() => {
    if (isRegister) {
      loadBuildings();
    }
  }, [isRegister]);

  const loadBuildings = async () => {
    try {
      const response = await getBuildings();
      setBuildings(response.data);
    } catch (err) {
      setError('فشل تحميل العمارات');
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
      
      console.log('Uploading to presigned URL:', data.url.substring(0, 200));
      
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
          url: data.url,
        });
        throw new Error(`فشل رفع الملف: ${response.status} ${response.statusText}`);
      }
      
      const cleanUrl = data.publicUrl || data.url.split('?')[0];
      const fileTypeName = prefix === 'id-cards' ? 'صورة البطاقة' : 'الإيصال';
      setSuccess(`تم رفع ${fileTypeName} بنجاح`);
      setTimeout(() => setSuccess(''), 3000);
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

  const validatePhone = (phone) => {
    const cleaned = normalizePhoneNumber(phone);
    const mobilePattern = /^01[0-2,5]{1}[0-9]{8}$/;
    const landlinePattern = /^02[0-9]{8}$/;
    const countryCodeMobilePattern = /^\+201[0-2,5]{1}[0-9]{8}$/;
    const countryCodeLandlinePattern = /^\+202[0-9]{8}$/;
    
    return mobilePattern.test(cleaned) || 
           landlinePattern.test(cleaned) || 
           countryCodeMobilePattern.test(cleaned) || 
           countryCodeLandlinePattern.test(cleaned);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate step 1 fields
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      setError('الاسم الكامل مطلوب (حرفين على الأقل)');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    // Move to step 2
    setRegisterStep(2);
  };

  const handleBackStep = () => {
    setRegisterStep(1);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // If login, handle normally
    if (!isRegister) {
      if (!validatePhone(formData.phone)) {
        setError('رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)');
        return;
      }

      if (formData.password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }

      try {
        setLoading(true);
        // Normalize phone number (convert Arabic numerals to regular) before sending
        const normalizedPhone = normalizePhoneNumber(formData.phone);
        const response = await login(normalizedPhone, formData.password);
        setSuccess('تم تسجيل الدخول بنجاح!');

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 1000);
      } catch (err) {
        setError(err.response?.data?.error || 'فشل تسجيل الدخول');
      } finally {
        setLoading(false);
      }
      return;
    }

    // If registration step 2, validate and submit
    if (registerStep === 2) {
      if (!formData.buildingId) {
        setError('يرجى اختيار العماره');
        return;
      }
      if (!formData.unit) {
        setError('يرجى إدخال رقم الشقة');
        return;
      }
      const unitNumber = parseInt(formData.unit);
      if (isNaN(unitNumber) || unitNumber < 1 || unitNumber > 24) {
        setError('رقم الشقة يجب أن يكون بين 1 و 24');
        return;
      }
      if (!formData.ownerType) {
        setError('يرجى اختيار نوع الملكية');
        return;
      }

      try {
        setLoading(true);
        // Normalize phone number (convert Arabic numerals to regular) before sending
        const normalizedPhone = normalizePhoneNumber(formData.phone);
        console.log('Frontend - Original phone:', formData.phone);
        console.log('Frontend - Normalized phone:', normalizedPhone);
        
        const response = await register({
          fullName: formData.fullName,
          phone: normalizedPhone,
          password: formData.password,
          buildingId: formData.buildingId,
          unit: formData.unit,
          ownerType: formData.ownerType,
          profilePic: formData.profilePic || '',
          idCardImage: formData.idCardImage || '',
          ownershipProof: formData.ownershipProof || ''
        });
        setSuccess('تم التسجيل بنجاح! جاري تسجيل الدخول...');

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 1000);
      } catch (err) {
        const errorData = err.response?.data;
        if (errorData?.existingUser) {
          // Show detailed error with existing user info
          setError(
            errorData.message || 
            `الشقة رقم ${formData.unit} في هذه العماره مسجلة بالفعل`
          );
          setExistingUserInfo(errorData.existingUser);
        } else {
          setError(errorData?.error || 'فشل التسجيل');
          setExistingUserInfo(null);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'clamp(0.5rem, 2vw, 1rem)'
    }}>
      <div className="card auth-card" style={{ maxWidth: isRegister && registerStep === 2 ? '600px' : '400px', width: '100%' }}>
        <div className="card-header">
          <h2 className="card-title">
            {isRegister 
              ? (registerStep === 1 ? 'تسجيل حساب جديد - الخطوة 1' : 'تسجيل حساب جديد - الخطوة 2')
              : 'تسجيل الدخول'
            }
          </h2>
          {isRegister && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <div style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: registerStep >= 1 ? '#667eea' : '#e5e7eb'
              }}></div>
              <div style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: registerStep >= 2 ? '#667eea' : '#e5e7eb'
              }}></div>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <div style={{ fontWeight: '600', marginBottom: existingUserInfo ? '0.5rem' : '0' }}>{error}</div>
            {existingUserInfo && (
              <div style={{ 
                marginTop: '0.75rem', 
                paddingTop: '0.75rem', 
                borderTop: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '0.5rem',
                padding: '0.75rem'
              }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                  هذه الشقة مسجلة للمستخدم التالي:
                </div>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <strong>الاسم:</strong> {existingUserInfo.fullName}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>رقم الهاتف:</strong> {existingUserInfo.phone}
                </div>
              </div>
            )}
          </div>
        )}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={isRegister && registerStep === 1 ? handleNextStep : handleSubmit}>
          {/* Step 1: Phone and Password (for registration) or Login form */}
          {(!isRegister || registerStep === 1) && (
            <>
              {isRegister && (
                <div className="form-group">
                  <label className="form-label">الاسم الكامل *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    minLength={2}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">رقم الهاتف *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow Arabic and regular numerals, but don't normalize display (user sees what they type)
                    setFormData({ ...formData, phone: e.target.value });
                  }}
                  onBlur={(e) => {
                    // Normalize on blur for display (optional - shows normalized version)
                    // But we'll keep the original for user experience
                  }}
                  required
                  placeholder="01X XXXX XXXX أو 02 XXXX XXXX (يدعم الأرقام العربية)"
                  inputMode="numeric"
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                  مثال: 01012345678 أو ٠١٠١٢٣٤٥٦٧٨ أو 0212345678
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">كلمة المرور *</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="6 أحرف على الأقل"
                />
              </div>

              {isRegister && (
                <div className="form-group">
                  <label className="form-label">تأكيد كلمة المرور *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>
              )}
            </>
          )}

          {/* Step 2: Building, Unit, and Attachments (for registration) */}
          {isRegister && registerStep === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">العماره *</label>
                <select
                  className="form-select"
                  value={formData.buildingId}
                  onChange={(e) => {
                    setFormData({ ...formData, buildingId: e.target.value });
                    setExistingUserInfo(null);
                    setError('');
                  }}
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
                <label className="form-label">رقم الشقة *</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => {
                    setFormData({ ...formData, unit: e.target.value });
                    setExistingUserInfo(null);
                    setError('');
                  }}
                  required
                >
                  <option value="">اختر رقم الشقة</option>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">نوع الملكية *</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ownerType"
                      value="owner"
                      checked={formData.ownerType === 'owner'}
                      onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                      required
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>مالك</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ownerType"
                      value="rental"
                      checked={formData.ownerType === 'rental'}
                      onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                      required
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>مستأجر</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">صورة الملف الشخصي (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadFile(file, 'profile-pics');
                      setFormData({ ...formData, profilePic: url });
                    } catch (err) {
                      // Error is already set in uploadFile
                    }
                  }}
                />
                {uploading && <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>جاري الرفع...</div>}
                {formData.profilePic && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img 
                      src={formData.profilePic} 
                      alt="Profile" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                    />
                    <br />
                    <a href={formData.profilePic} target="_blank" rel="noreferrer" className="btn btn-secondary btn-small">
                      عرض الصورة
                    </a>
                  </div>
                )}
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
            </>
          )}

          <div className="form-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
            {isRegister && registerStep === 2 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleBackStep}
                disabled={loading}
              >
                رجوع
              </button>
            )}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || uploading}
              style={{ flex: 1 }}
            >
              {loading 
                ? (isRegister ? 'جاري التسجيل...' : 'جاري تسجيل الدخول...') 
                : (isRegister 
                  ? (registerStep === 1 ? 'التالي' : 'تسجيل')
                  : 'تسجيل الدخول'
                )
              }
            </button>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => {
                setIsRegister(!isRegister);
                setRegisterStep(1);
                setError('');
                setSuccess('');
                setExistingUserInfo(null);
                setFormData({ 
                  fullName: '',
                  phone: '', 
                  password: '', 
                  confirmPassword: '',
                  buildingId: '',
                  unit: '',
                  ownerType: '',
                  profilePic: '',
                  idCardImage: '',
                  ownershipProof: ''
                });
              }}
            >
              {isRegister 
                ? 'لديك حساب بالفعل؟ تسجيل الدخول' 
                : 'ليس لديك حساب؟ سجل الآن'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
