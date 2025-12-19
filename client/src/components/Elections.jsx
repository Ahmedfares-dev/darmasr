import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getElections, createElection, deleteElection, getBuildings, getWinners, getCurrentUser } from '../services/api';
import '../App.css';

function Elections() {
  const [elections, setElections] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('elections'); // 'elections' or 'buildings'
  const [buildingsWinners, setBuildingsWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    buildingId: '',
    number: '',
    startDate: '',
    endDate: ''
  });
  const [error, setError] = useState('');
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [buildingSearch, setBuildingSearch] = useState('');
  const buildingDropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const response = await getCurrentUser();
        if (mounted) {
          const userData = response.data.user;
          setCurrentUser(userData);
          setUserType(userData.userType || 'resident');
          await loadData(userData);
        }
      } catch (err) {
        console.error('Failed to load current user:', err);
        if (mounted) {
          setUserType('resident');
          await loadData(null);
        }
      }
    };
    loadUser();
    return () => { mounted = false; };
  }, []);


  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buildingDropdownRef.current && !buildingDropdownRef.current.contains(event.target)) {
        setBuildingDropdownOpen(false);
        setBuildingSearch('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && buildingDropdownOpen) {
        setBuildingDropdownOpen(false);
        setBuildingSearch('');
      }
    };

    if (buildingDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [buildingDropdownOpen]);

  const loadData = async (user) => {
    try {
      setLoading(true);
      setError('');
      
      // For residents, only load elections for their building
      let electionsRes;
      if (user?.userType === 'resident' && user?.buildingId) {
        const buildingId = user.buildingId._id || user.buildingId;
        electionsRes = await getElections(buildingId);
      } else {
        electionsRes = await getElections();
      }
      
      const buildingsRes = await getBuildings();
      
      setElections(electionsRes.data || []);
      setBuildings(buildingsRes.data || []);
    } catch (err) {
      console.error('Load data error:', err);
      setError(err.response?.data?.error || 'فشل تحميل البيانات');
      setElections([]);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingsWinners = async (buildingsList) => {
    try {
      setLoadingWinners(true);
      const winnersRes = await getWinners('confirmed');
      const winners = winnersRes.data;
      
      // Group winners by building
      const buildingWinnersMap = {};
      
      // Initialize all buildings
      buildingsList.forEach(building => {
        buildingWinnersMap[building._id] = {
          buildingNumber: building.number,
          winners: []
        };
      });
      
      // Add winners to their buildings
      winners.forEach(winner => {
        if (winner.electionId?.buildingId?._id) {
          const buildingId = winner.electionId.buildingId._id;
          if (buildingWinnersMap[buildingId]) {
            buildingWinnersMap[buildingId].winners.push({
              electionNumber: winner.electionId.number,
              winnerName: winner.nominationId?.residentId?.fullName || 'غير متاح',
              unit: winner.nominationId?.residentId?.unit || '',
              voteCount: winner.voteCount || 0
            });
          }
        }
      });
      
      // Convert to array and sort by building number
      const buildingsWinnersArray = Object.entries(buildingWinnersMap)
        .map(([buildingId, data]) => ({
          buildingId,
          buildingNumber: data.buildingNumber,
          winners: data.winners
        }))
        .sort((a, b) => {
          const numA = parseInt(a.buildingNumber) || 0;
          const numB = parseInt(b.buildingNumber) || 0;
          return numA - numB;
        });
      
      setBuildingsWinners(buildingsWinnersArray);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل الفائزين');
    } finally {
      setLoadingWinners(false);
    }
  };


  useEffect(() => {
    if (activeTab === 'buildings' && buildings.length > 0 && userType === 'manager') {
      loadBuildingsWinners(buildings);
    }
  }, [activeTab, buildings, userType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.buildingId) {
      setError('يجب اختيار العماره');
      return;
    }

    try {
      await createElection(formData);
      setShowModal(false);
      setFormData({
        buildingId: '',
        number: '',
        startDate: '',
        endDate: ''
      });
      setBuildingDropdownOpen(false);
      setBuildingSearch('');
      loadData(currentUser);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إنشاء الانتخابات');
    }
  };

  const handleDelete = async (electionId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الانتخابات؟ سيتم حذف جميع البيانات المرتبطة بها (الترشيحات، الأصوات، الفائزون).')) return;

    try {
      setError('');
      await deleteElection(electionId);
      loadData(currentUser);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل حذف الانتخابات');
    }
  };

  const filteredBuildings = buildings.filter(building =>
    building.number.toString().includes(buildingSearch)
  );

  const getStatusBadge = (election) => {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (election.status === 'winner_confirmed') {
      return <span className="badge badge-success">تم تأكيد الفائز</span>;
    } else if (election.status === 'winner_pending') {
      return <span className="badge badge-warning">في انتظار التأكيد</span>;
    } else if (now < start) {
      return <span className="badge badge-info">مجدولة</span>;
    } else if (now >= start && now <= end) {
      return <span className="badge badge-primary">جارية</span>;
    } else {
      return <span className="badge badge-secondary">انتهت</span>;
    }
  };

  if (loading) {
    return <div className="loading">جاري تحميل الانتخابات...</div>;
  }

  // Ensure we have userType set
  const displayUserType = userType || 'resident';

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {displayUserType === 'resident' && currentUser?.buildingId 
              ? `الانتخابات - العماره ${currentUser.buildingId.number || currentUser.buildingId || ''}`
              : 'الانتخابات'
            }
          </h2>
          {displayUserType === 'manager' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + إنشاء انتخابات
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Tabs */}
        <div className="election-tabs" style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          borderBottom: '2px solid #e5e7eb',
          marginTop: '1rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.25rem'
        }}>
          <button
            className={`btn ${activeTab === 'elections' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('elections')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 'clamp(0.75rem, 3vw, 1rem)', padding: 'clamp(0.5rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1.5rem)' }}
          >
            🗳️ الانتخابات ({elections.length})
          </button>
          {displayUserType === 'manager' && (
            <button
              className={`btn ${activeTab === 'buildings' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('buildings')}
              style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 'clamp(0.75rem, 3vw, 1rem)', padding: 'clamp(0.5rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1.5rem)' }}
            >
              🏢 العمارات والفائزون ({buildings.length})
            </button>
          )}
        </div>

        {/* Elections Tab */}
        {activeTab === 'elections' && (
          <div style={{ padding: '1.5rem 0' }}>

            {elections.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🗳️</div>
                <p>لا توجد انتخابات. قم بإنشاء أول انتخابات!</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>العماره</th>
                      <th>رقم الانتخابات</th>
                      <th>تاريخ البدء</th>
                      <th>تاريخ الانتهاء</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elections.map(election => (
                      <tr key={election._id}>
                        <td>{election.buildingId?.number || 'غير متاح'}</td>
                        <td>{election.number}</td>
                        <td>{new Date(election.startDate).toLocaleDateString('ar-EG')}</td>
                        <td>{new Date(election.endDate).toLocaleDateString('ar-EG')}</td>
                        <td>{getStatusBadge(election)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/elections/${election._id}`} className="btn btn-primary btn-small">
                          عرض
                        </Link>
                        {userType === 'manager' && (
                          <button 
                            className="btn btn-danger btn-small" 
                            onClick={() => handleDelete(election._id)}
                          >
                            حذف
                          </button>
                        )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Buildings Winners Tab */}
        {activeTab === 'buildings' && (
          <div style={{ padding: '1.5rem' }}>
            {loadingWinners ? (
              <div className="loading">جاري تحميل الفائزين...</div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>رقم العماره</th>
                      <th>اسم الفائز</th>
                      <th>رقم الشقة</th>
                      <th>رقم الانتخابات</th>
                      <th>عدد الأصوات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingsWinners.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                          <div className="empty-state">
                            <div className="empty-state-icon">🏆</div>
                            <p>لا توجد فائزين مؤكدين بعد</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      buildingsWinners.map(building => (
                        building.winners.length > 0 ? (
                          building.winners.map((winner, index) => (
                            <tr key={`${building.buildingId}-${index}`}>
                              <td>{building.buildingNumber}</td>
                              <td>
                                <strong>{winner.winnerName}</strong>
                              </td>
                              <td>{winner.unit || '-'}</td>
                              <td>{winner.electionNumber}</td>
                              <td>
                                <span className="badge badge-success">{winner.voteCount} صوت</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr key={building.buildingId}>
                            <td>{building.buildingNumber}</td>
                            <td colSpan="4" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                              لا يوجد فائز مؤكد
                            </td>
                          </tr>
                        )
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">إنشاء انتخابات</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">العماره *</label>
                <div className="custom-dropdown" ref={buildingDropdownRef}>
                  <button
                    type="button"
                    className={`custom-dropdown-toggle ${buildingDropdownOpen ? 'open' : ''} ${formData.buildingId ? 'has-value' : ''}`}
                    onClick={() => setBuildingDropdownOpen(!buildingDropdownOpen)}
                  >
                    <span>
                      {formData.buildingId 
                        ? `العماره ${buildings.find(b => b._id === formData.buildingId)?.number || ''}`
                        : 'اختر العماره'
                      }
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {buildingDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder="ابحث عن عماره..."
                          className="dropdown-search-input"
                          value={buildingSearch}
                          onChange={(e) => setBuildingSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div className="dropdown-options">
                        <div
                          className={`dropdown-option ${!formData.buildingId ? 'selected' : ''}`}
                          onClick={() => {
                            setFormData({ ...formData, buildingId: '' });
                            setBuildingDropdownOpen(false);
                            setBuildingSearch('');
                          }}
                        >
                          <span>اختر العماره</span>
                          {!formData.buildingId && <span className="check-mark">✓</span>}
                        </div>
                        {filteredBuildings.length > 0 ? (
                          filteredBuildings.map(building => (
                            <div
                              key={building._id}
                              className={`dropdown-option ${formData.buildingId === building._id ? 'selected' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, buildingId: building._id });
                                setBuildingDropdownOpen(false);
                                setBuildingSearch('');
                              }}
                            >
                              <span>العماره {building.number}</span>
                              {formData.buildingId === building._id && <span className="check-mark">✓</span>}
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-option" style={{ color: '#9ca3af', cursor: 'default' }}>
                            <span>لا توجد نتائج</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">رقم الانتخابات *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">تاريخ البدء *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">تاريخ الانتهاء *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Elections;
