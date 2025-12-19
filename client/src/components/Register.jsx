import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createResident, getBuildings, getUploadPresign } from '../services/api';
import '../App.css';

function Register() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buildingId: '',
    fullName: '',
    phone: '',
    unit: '',
    ownerType: '',
    idCardImage: '',
    ownershipProof: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBuildings();
  }, []);

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
      
      // Log the presigned URL for debugging
      console.log('Uploading to presigned URL:', data.url.substring(0, 200));
      
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
          url: data.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`فشل رفع الملف: ${response.status} ${response.statusText}`);
      }
      
      // Use the public URL from the response, or construct it from presigned URL
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
    setSuccess('');

    // Validate phone number
    if (!validateEgyptianPhone(formData.phone)) {
      setError('رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)');
      return;
    }

    // Validate flat number (1-24)
    const flatNumber = parseInt(formData.unit);
    if (isNaN(flatNumber) || flatNumber < 1 || flatNumber > 24) {
      setError('رقم الشقة يجب أن يكون بين 1 و 24');
      return;
    }

    try {
      setLoading(true);
      // Normalize phone number (convert Arabic numerals to regular) before sending
      const normalizedFormData = {
        ...formData,
        phone: normalizePhoneNumber(formData.phone)
      };
      await createResident(normalizedFormData);
      setSuccess('تم التسجيل بنجاح! سيتم مراجعة بياناتك قريباً.');
      setTimeout(() => {
        navigate('/residents');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card-header">
          <h2 className="card-title">تسجيل جديد</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">الاسم الكامل *</label>
            <input
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف *</label>
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
            <label className="form-label">رقم الشقة *</label>
            <select
              className="form-select"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
            <label className="form-label">رابط صورة البطاقة (اختياري)</label>
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
            <label className="form-label">رابط إيصال الملكية/الإيجار (اختياري)</label>
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

          <div className="form-buttons">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري التسجيل...' : 'تسجيل'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/residents')}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

