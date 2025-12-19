import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getElection, tallyElection, createNomination, getResidents, castVote, getVoteCount, approveNomination, rejectNomination, confirmWinner, rejectWinner, getCurrentUser, getVotes } from '../services/api';
import '../App.css';

function ElectionDetail() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNominationModal, setShowNominationModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [residents, setResidents] = useState([]);
  const [voteCount, setVoteCount] = useState(null);
  const [nominationData, setNominationData] = useState({
    residentId: '',
    statement: '',
    qualifications: '',
    goals: ''
  });
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'nominations', 'winners'
  const [currentUser, setCurrentUser] = useState(null);
  const [processingNominationId, setProcessingNominationId] = useState(null);
  const [processingWinnerId, setProcessingWinnerId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadElection();
    loadResidents();
    loadCurrentUser();
  }, [id]);

  useEffect(() => {
    if (currentUser && election) {
      checkUserVote();
    }
  }, [currentUser, election]);

  const loadCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadElection = async () => {
    try {
      setLoading(true);
      const response = await getElection(id);
      setElection(response.data);
      if (response.data.status === 'running' || response.data.status === 'ended') {
        loadVoteCount();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تحميل الانتخابات');
    } finally {
      setLoading(false);
    }
  };

  const loadResidents = async () => {
    try {
      if (election?.buildingId?._id) {
        const response = await getResidents(election.buildingId._id);
        setResidents(response.data);
      }
    } catch (err) {
      console.error('Failed to load residents:', err);
    }
  };

  const loadVoteCount = async () => {
    try {
      const response = await getVoteCount(id);
      setVoteCount(response.data);
    } catch (err) {
      console.error('Failed to load vote count:', err);
    }
  };

  const checkUserVote = async () => {
    try {
      if (!currentUser || !election) return;
      const userId = currentUser.id || currentUser._id;
      const votesRes = await getVotes(id);
      const userVoteFound = votesRes.data.find(vote => {
        const voteResidentId = vote.residentId?._id || vote.residentId || vote.residentId?.id;
        return voteResidentId && voteResidentId.toString() === userId.toString();
      });
      if (userVoteFound) {
        setHasVoted(true);
        setUserVote(userVoteFound);
      } else {
        setHasVoted(false);
        setUserVote(null);
      }
    } catch (err) {
      console.error('Failed to check user vote:', err);
    }
  };

  useEffect(() => {
    if (election?.buildingId?._id) {
      loadResidents();
    }
  }, [election?.buildingId?._id]);

  const handleNominationSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await createNomination({ ...nominationData, electionId: id });
      setShowNominationModal(false);
      setNominationData({ residentId: '', statement: '', qualifications: '', goals: '' });
      setSuccess('تم إرسال الترشيح بنجاح!');
      loadElection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إرسال الترشيح');
    }
  };

  const handleVote = async (nominationId, residentId) => {
    setError('');

    if (!window.confirm('هل أنت متأكد من التصويت لهذا المرشح؟')) return;

    try {
      setVoting(true);
      const userId = residentId || currentUser?.id || currentUser?._id || nominationData.residentId;
      const nomId = nominationId || selectedNomination?._id;
      
      if (!userId || !nomId) {
        setError('البيانات غير مكتملة');
        return;
      }

      await castVote({
        electionId: id,
        residentId: userId,
        nominationId: nomId
      });
      setShowVoteModal(false);
      setSuccess('تم التصويت بنجاح!');
      loadElection();
      loadVoteCount();
      checkUserVote();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل التصويت');
    } finally {
      setVoting(false);
    }
  };

  const handleTally = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في عد الأصوات؟ سيتم تحديد الفائز.')) return;

    try {
      await tallyElection(id);
      setSuccess('تم عد الأصوات بنجاح! الفائز في انتظار التأكيد.');
      loadElection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل عد الأصوات');
    }
  };

  const handleApproveNomination = async (nominationId) => {
    try {
      setProcessingNominationId(nominationId);
      setError('');
      await approveNomination(nominationId);
      setSuccess('تم اعتماد الترشيح بنجاح!');
      loadElection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل اعتماد الترشيح');
    } finally {
      setProcessingNominationId(null);
    }
  };

  const handleRejectNomination = async (nominationId) => {
    if (!window.confirm('هل أنت متأكد من رفض هذا الترشيح؟')) return;

    try {
      setProcessingNominationId(nominationId);
      setError('');
      await rejectNomination(nominationId);
      setSuccess('تم رفض الترشيح بنجاح!');
      loadElection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض الترشيح');
    } finally {
      setProcessingNominationId(null);
    }
  };

  const handleConfirmWinner = async (winnerId) => {
    if (!window.confirm('هل أنت متأكد من تأكيد هذا الفائز؟')) return;

    try {
      setProcessingWinnerId(winnerId);
      setError('');
      const userId = currentUser?.id || currentUser?._id;
      await confirmWinner(winnerId, userId);
      setSuccess('تم تأكيد الفائز بنجاح!');
      loadElection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تأكيد الفائز');
    } finally {
      setProcessingWinnerId(null);
    }
  };

  const handleRejectWinner = async (winnerId) => {
    if (!window.confirm('هل أنت متأكد من رفض هذا الفائز؟')) return;

    try {
      setProcessingWinnerId(winnerId);
      setError('');
      await rejectWinner(winnerId);
      setSuccess('تم رفض الفائز بنجاح!');
      loadElection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل رفض الفائز');
    } finally {
      setProcessingWinnerId(null);
    }
  };

  const isElectionRunning = () => {
    if (!election) return false;
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);
    return now >= start && now <= end;
  };

  const canNominate = () => {
    if (!election) return false;
    // Allow nominations until the election ends
    return new Date() < new Date(election.endDate);
  };

  if (loading) {
    return <div className="loading">جاري تحميل تفاصيل الانتخابات...</div>;
  }

  if (!election) {
    return <div className="alert alert-error">لم يتم العثور على الانتخابات</div>;
  }

  const approvedNominations = election.nominations?.filter(n => n.status === 'approved') || [];
  const pendingNominations = election.nominations?.filter(n => n.status === 'pending') || [];

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'مجدولة',
      'running': 'جارية',
      'ended': 'انتهت',
      'winner_pending': 'في انتظار التأكيد',
      'winner_confirmed': 'تم التأكيد'
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">انتخابات رقم {election.number} - العماره {election.buildingId?.number}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
            {canNominate() && (
              <button className="btn btn-primary" onClick={() => setShowNominationModal(true)}>
                ترشح نفسك
              </button>
            )}
            {isElectionRunning() && approvedNominations.length > 0 && currentUser?.userType !== 'resident' && (
              <button className="btn btn-success" onClick={() => setShowVoteModal(true)}>
                التصويت
              </button>
            )}
            {election.status === 'ended' && !election.winner && (
              <button className="btn btn-secondary" onClick={handleTally}>
                عد الأصوات
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Show message if nominate button is not available */}
        {!canNominate() && (
          <div className="alert alert-warning">
            انتهت فترة الترشيح. انتهت الانتخابات في {new Date(election.endDate).toLocaleString('ar-EG')}. يمكن تقديم الترشيحات فقط قبل انتهاء الانتخابات.
          </div>
        )}

        {/* Show message if vote button is not available */}
        {!isElectionRunning() && approvedNominations.length > 0 && (
          <div className="alert alert-info">
            {new Date() < new Date(election.startDate) 
              ? `سيبدأ التصويت في ${new Date(election.startDate).toLocaleString('ar-EG')}`
              : `انتهى التصويت في ${new Date(election.endDate).toLocaleString('ar-EG')}`
            }
          </div>
        )}
        {isElectionRunning() && approvedNominations.length === 0 && (
          <div className="alert alert-warning">
            لا توجد ترشيحات معتمدة بعد. يرجى الموافقة على الترشيحات قبل بدء التصويت.
          </div>
        )}

        {/* Simple voting interface for residents */}
        {currentUser?.userType === 'resident' && isElectionRunning() && approvedNominations.length > 0 && (
          <div style={{ padding: '1.5rem', marginTop: '1rem' }}>
            {hasVoted ? (
              <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>✅ تم التصويت بنجاح!</h3>
                {userVote && (
                  <p>
                    لقد قمت بالتصويت لـ: <strong>{userVote.nominationId?.residentId?.fullName}</strong>
                  </p>
                )}
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: 'clamp(1.125rem, 4vw, 1.5rem)', color: '#111827' }}>
                  🗳️ اختر المرشح الذي تريد التصويت له
                </h3>
                <div className="grid grid-2" style={{ marginTop: '1rem', gap: '1rem' }}>
                  {approvedNominations.map(nomination => (
                    <div
                      key={nomination._id}
                      className="voting-card"
                      style={{
                        padding: 'clamp(1rem, 3vw, 2rem)',
                        border: '2px solid #e5e7eb',
                        borderRadius: '16px',
                        background: '#fff',
                        cursor: voting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: voting ? 0.6 : 1,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onClick={() => {
                        if (!voting && currentUser) {
                          const userId = currentUser.id || currentUser._id;
                          handleVote(nomination._id, userId);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!voting) {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!voting) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        {/* Profile Picture */}
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                          {nomination.residentId?.profilePic ? (
                            <img
                              src={nomination.residentId.profilePic}
                              alt={nomination.residentId.fullName}
                              className="profile-pic"
                              style={{
                                width: 'clamp(80px, 20vw, 140px)',
                                height: 'clamp(80px, 20vw, 140px)',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid #667eea',
                                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          {!nomination.residentId?.profilePic && (
                            <div className="initial" style={{
                              width: 'clamp(80px, 20vw, 140px)',
                              height: 'clamp(80px, 20vw, 140px)',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                              color: 'white',
                              border: '3px solid #667eea',
                              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                              fontWeight: 'bold'
                            }}>
                              {nomination.residentId?.fullName?.charAt(0)?.toUpperCase() || '👤'}
                            </div>
                          )}
                        </div>
                        
                        {/* Name and Unit */}
                        <h4 style={{ 
                          marginBottom: '0.5rem', 
                          color: '#111827', 
                          fontSize: 'clamp(1rem, 4vw, 1.375rem)',
                          fontWeight: '600',
                          wordBreak: 'break-word'
                        }}>
                          {nomination.residentId?.fullName}
                        </h4>
                        <p style={{ 
                          color: '#6b7280', 
                          marginBottom: '1rem', 
                          fontSize: 'clamp(0.8125rem, 3vw, 0.9375rem)',
                          fontWeight: '500'
                        }}>
                          🏠 الوحدة {nomination.residentId?.unit}
                        </p>
                        
                        {/* Nomination Details */}
                        <div className="details-box" style={{ 
                          padding: 'clamp(0.75rem, 2vw, 1.25rem)', 
                          background: 'linear-gradient(to bottom, #f9fafb, #ffffff)', 
                          borderRadius: '12px',
                          marginBottom: '1rem',
                          textAlign: 'right',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: '#667eea', fontSize: '0.9375rem', display: 'block', marginBottom: '0.5rem' }}>
                              📝 البيان:
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: '1.7', textAlign: 'right' }}>
                              {nomination.statement}
                            </p>
                          </div>
                          {nomination.qualifications && (
                            <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                              <strong style={{ color: '#667eea', fontSize: '0.9375rem', display: 'block', marginBottom: '0.5rem' }}>
                                🎓 المؤهلات:
                              </strong>
                              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: '1.7', textAlign: 'right' }}>
                                {nomination.qualifications}
                              </p>
                            </div>
                          )}
                          {nomination.goals && (
                            <div style={{ paddingTop: nomination.qualifications ? '1rem' : 0, borderTop: nomination.qualifications ? '1px solid #e5e7eb' : 'none' }}>
                              <strong style={{ color: '#667eea', fontSize: '0.9375rem', display: 'block', marginBottom: '0.5rem' }}>
                                🎯 الأهداف:
                              </strong>
                              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: '1.7', textAlign: 'right' }}>
                                {nomination.goals}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Vote Button */}
                        <button
                          className="btn btn-primary"
                          disabled={voting}
                          style={{ 
                            width: '100%', 
                            padding: '1rem', 
                            fontSize: '1.0625rem',
                            fontWeight: '600',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          {voting ? '⏳ جاري التصويت...' : '✅ التصويت لهذا المرشح'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tabs - Show for managers or when election is not running */}
        {(currentUser?.userType === 'manager' || !isElectionRunning() || approvedNominations.length === 0) && (
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
              className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('info')}
              style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 'clamp(0.75rem, 3vw, 1rem)', padding: 'clamp(0.5rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1.5rem)' }}
            >
              📋 المعلومات
            </button>
            <button
              className={`btn ${activeTab === 'nominations' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('nominations')}
              style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 'clamp(0.75rem, 3vw, 1rem)', padding: 'clamp(0.5rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1.5rem)' }}
            >
              🗳️ الترشيحات ({election.nominations?.length || 0})
            </button>
            <button
              className={`btn ${activeTab === 'winners' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('winners')}
              style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 'clamp(0.75rem, 3vw, 1rem)', padding: 'clamp(0.5rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1.5rem)' }}
            >
              🏆 الفائزون {election.winner ? '(1)' : '(0)'}
            </button>
          </div>
        )}

        {/* Tab Content - Only show tabs for managers or when election is not running */}
        {((currentUser?.userType === 'manager' || !isElectionRunning() || approvedNominations.length === 0) && activeTab === 'info') && (
          <div style={{ padding: '1.5rem' }}>
            <div className="grid grid-2" style={{ marginTop: '1rem' }}>
              <div>
                <h3>تفاصيل الانتخابات</h3>
                <p><strong>العماره:</strong> {election.buildingId?.number}</p>
                <p><strong>رقم الانتخابات:</strong> {election.number}</p>
                <p><strong>تاريخ البدء:</strong> {new Date(election.startDate).toLocaleString('ar-EG')}</p>
                <p><strong>تاريخ الانتهاء:</strong> {new Date(election.endDate).toLocaleString('ar-EG')}</p>
                <p><strong>الحالة:</strong> {getStatusText(election.status)}</p>
              </div>
              <div>
                <h3>الإحصائيات</h3>
                <p><strong>إجمالي الترشيحات:</strong> {election.nominations?.length || 0}</p>
                <p><strong>الترشيحات المعتمدة:</strong> {approvedNominations.length}</p>
                <p><strong>الترشيحات المعلقة:</strong> {pendingNominations.length}</p>
                <p><strong>إجمالي الأصوات:</strong> {election.votesCount || 0}</p>
                {voteCount && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>تفصيل الأصوات:</strong>
                    <ul>
                      {Object.entries(voteCount.voteCounts || {}).map(([nomId, count]) => {
                        const nom = election.nominations?.find(n => n._id === nomId);
                        return nom ? (
                          <li key={nomId}>{nom.residentId?.fullName}: {count} صوت</li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nominations' && (
          <div style={{ padding: '1.5rem' }}>
            {/* Pending Nominations */}
            {pendingNominations.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>⏳ الترشيحات المعلقة ({pendingNominations.length})</h3>
                <div className="grid grid-2">
                  {pendingNominations.map(nomination => (
                    <div key={nomination._id} style={{ 
                      padding: '1.5rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      background: '#fffbeb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>{nomination.residentId?.fullName} - الوحدة {nomination.residentId?.unit}</h4>
                        {currentUser?.userType === 'manager' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-success btn-small"
                              onClick={() => handleApproveNomination(nomination._id)}
                              disabled={processingNominationId === nomination._id}
                            >
                              {processingNominationId === nomination._id ? '⏳' : '✅'} موافقة
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleRejectNomination(nomination._id)}
                              disabled={processingNominationId === nomination._id}
                            >
                              ❌ رفض
                            </button>
                          </div>
                        )}
                      </div>
                      <p><strong>البيان:</strong> {nomination.statement}</p>
                      {nomination.qualifications && <p><strong>المؤهلات:</strong> {nomination.qualifications}</p>}
                      {nomination.goals && <p><strong>الأهداف:</strong> {nomination.goals}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Nominations */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>✅ الترشيحات المعتمدة ({approvedNominations.length})</h3>
              {approvedNominations.length === 0 ? (
                <p>لا توجد ترشيحات معتمدة بعد.</p>
              ) : (
                <div className="grid grid-2">
                  {approvedNominations.map(nomination => (
                    <div key={nomination._id} style={{ 
                      padding: '1.5rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px',
                      background: '#f0fdf4'
                    }}>
                      <h4>{nomination.residentId?.fullName} - الوحدة {nomination.residentId?.unit}</h4>
                      <p><strong>البيان:</strong> {nomination.statement}</p>
                      {nomination.qualifications && <p><strong>المؤهلات:</strong> {nomination.qualifications}</p>}
                      {nomination.goals && <p><strong>الأهداف:</strong> {nomination.goals}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {((currentUser?.userType === 'manager' || !isElectionRunning() || approvedNominations.length === 0) && activeTab === 'winners') && (
          <div style={{ padding: '1.5rem' }}>
            {election.winner ? (
              <div style={{ 
                padding: '2rem', 
                background: '#f0f9ff', 
                borderRadius: '6px',
                border: '2px solid #3b82f6'
              }}>
                <h3 style={{ marginBottom: '1.5rem' }}>🏆 الفائز</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>الاسم:</strong> {election.winner.nominationId?.residentId?.fullName}</p>
                  <p><strong>الوحدة:</strong> {election.winner.nominationId?.residentId?.unit}</p>
                  <p><strong>الأصوات:</strong> {election.winner.voteCount}</p>
                  <p><strong>الحالة:</strong> 
                    <span className={`badge badge-${election.winner.status === 'confirmed' ? 'success' : 'warning'}`} style={{ marginRight: '0.5rem' }}>
                      {election.winner.status === 'confirmed' ? 'مؤكد' : 'في انتظار التأكيد'}
                    </span>
                  </p>
                </div>
                {currentUser?.userType === 'manager' && election.winner.status !== 'confirmed' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleConfirmWinner(election.winner._id)}
                      disabled={processingWinnerId === election.winner._id}
                    >
                      {processingWinnerId === election.winner._id ? '⏳ جاري التأكيد...' : '✅ تأكيد الفائز'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRejectWinner(election.winner._id)}
                      disabled={processingWinnerId === election.winner._id}
                    >
                      ❌ رفض الفائز
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                  {election.status === 'ended' 
                    ? 'لم يتم تحديد الفائز بعد. قم بعد الأصوات أولاً.'
                    : 'لم يتم تحديد الفائز بعد. الانتخابات لم تنته بعد.'}
                </p>
                {election.status === 'ended' && !election.winner && (
                  <button className="btn btn-primary" onClick={handleTally} style={{ marginTop: '1rem' }}>
                    عد الأصوات
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showNominationModal && (
        <div className="modal" onClick={() => setShowNominationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ترشح نفسك</h3>
              <button className="close-btn" onClick={() => setShowNominationModal(false)}>×</button>
            </div>
            <form onSubmit={handleNominationSubmit}>
              <div className="form-group">
                <label className="form-label">الساكن *</label>
                <select
                  className="form-select"
                  value={nominationData.residentId}
                  onChange={(e) => setNominationData({ ...nominationData, residentId: e.target.value })}
                  required
                >
                  <option value="">اختر نفسك</option>
                  {residents.map(resident => (
                    <option key={resident._id} value={resident._id}>
                      {resident.fullName} - الوحدة {resident.unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">البيان *</label>
                <textarea
                  className="form-textarea"
                  value={nominationData.statement}
                  onChange={(e) => setNominationData({ ...nominationData, statement: e.target.value })}
                  required
                  placeholder="لماذا تريد الترشح لهذا المنصب؟"
                />
              </div>
              <div className="form-group">
                <label className="form-label">المؤهلات</label>
                <textarea
                  className="form-textarea"
                  value={nominationData.qualifications}
                  onChange={(e) => setNominationData({ ...nominationData, qualifications: e.target.value })}
                  placeholder="مؤهلاتك وخبراتك"
                />
              </div>
              <div className="form-group">
                <label className="form-label">الأهداف</label>
                <textarea
                  className="form-textarea"
                  value={nominationData.goals}
                  onChange={(e) => setNominationData({ ...nominationData, goals: e.target.value })}
                  placeholder="أهدافك في حالة انتخابك"
                />
              </div>
              <div className="form-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNominationModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  إرسال الترشيح
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVoteModal && (
        <div className="modal" onClick={() => setShowVoteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">التصويت</h3>
              <button className="close-btn" onClick={() => setShowVoteModal(false)}>×</button>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">الساكن *</label>
                <select
                  className="form-select"
                  value={nominationData.residentId}
                  onChange={(e) => setNominationData({ ...nominationData, residentId: e.target.value })}
                  required
                >
                  <option value="">اختر نفسك</option>
                  {residents.map(resident => (
                    <option key={resident._id} value={resident._id}>
                      {resident.fullName} - الوحدة {resident.unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">التصويت لـ *</label>
                <select
                  className="form-select"
                  value={selectedNomination?._id || ''}
                  onChange={(e) => {
                    const nom = approvedNominations.find(n => n._id === e.target.value);
                    setSelectedNomination(nom);
                  }}
                  required
                >
                  <option value="">اختر مرشح</option>
                  {approvedNominations.map(nomination => (
                    <option key={nomination._id} value={nomination._id}>
                      {nomination.residentId?.fullName} - الوحدة {nomination.residentId?.unit}
                    </option>
                  ))}
                </select>
              </div>
              {selectedNomination && (
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px', marginBottom: '1rem' }}>
                  <h4>{selectedNomination.residentId?.fullName}</h4>
                  <p><strong>البيان:</strong> {selectedNomination.statement}</p>
                </div>
              )}
              <div className="form-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVoteModal(false)}>
                  إلغاء
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleVote}
                  disabled={!nominationData.residentId || !selectedNomination}
                >
                  التصويت
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ElectionDetail;
