'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, User, Wrench, Package, CheckCircle2, Clock,
  AlertTriangle, ArrowRight, Filter, RefreshCw, UserPlus, Check, MapPin
} from 'lucide-react';

import Link from 'next/link';
import IssueDetailModal from '../../components/IssueDetailModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [issues, setIssues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);

  
  // Assign state
  const [assigningId, setAssigningId] = useState(null);
  const [selectedTechs, setSelectedTechs] = useState({}); // { issueId: techId }

  // Modal state
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch issues
  const fetchIssues = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/issues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIssues(data.issues || []);
      } else {
        setError(data.message || 'Failed to load work orders');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching issues from server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch technician list (Admin Only)
  const fetchTechnicians = async () => {
    if (!token || user?.role !== 'Admin') return;
    try {
      const res = await fetch('/api/auth/technicians', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTechnicians(data.technicians || []);
      }
    } catch (err) {
      console.error('Failed to load technicians:', err);
    }
  };

  // Fetch assets list for summary metrics
  const fetchAssets = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/assets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to load assets for dashboard metrics:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchIssues();
      fetchTechnicians();
      fetchAssets();
    }
  }, [token]);


  // Handle assigning an issue
  const handleAssignIssue = async (issueId) => {
    const techId = selectedTechs[issueId];
    if (!techId) {
      alert('Please select a technician first.');
      return;
    }

    setAssigningId(issueId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/issues/${issueId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ technicianId: techId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || 'Issue assigned successfully!');
        fetchIssues(); // Refresh list
      } else {
        setError(data.message || 'Failed to assign issue');
      }
    } catch (err) {
      console.error(err);
      setError('Network error assigning issue');
    } finally {
      setAssigningId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Authenticating session...</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Checking authorization token</div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'Admin';

  // React-side local search and filtering logic
  const filteredIssues = issues.filter((issue) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = issue.title?.toLowerCase().includes(q);
      const codeMatch = issue.assetId?.uniqueCode?.toLowerCase().includes(q);
      const nameMatch = issue.assetId?.name?.toLowerCase().includes(q);
      const issueNumMatch = issue.issueNumber?.toLowerCase().includes(q);
      if (!titleMatch && !codeMatch && !nameMatch && !issueNumMatch) {
        return false;
      }
    }
    if (statusFilter && issue.status !== statusFilter) {
      return false;
    }
    if (priorityFilter && issue.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Session Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem' }}>Welcome, {user.name}</h1>
            <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-info'}`}>
              {isAdmin ? <Shield size={12} /> : <User size={12} />} {user.role} Workspace
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Authenticated Session Active | Account: <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => { fetchIssues(); fetchAssets(); }} style={refreshButtonStyle} title="Reload Workspace">
            <RefreshCw size={16} />
          </button>
          
          <Link href="/assets" style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            Asset Catalog
          </Link>
        </div>
      </div>

      {/* Quick Statistics Panels */}
      <div style={statsGridStyle}>
        {isAdmin ? (
          <>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={statHeaderStyle}>
                <span style={statTitleStyle}>Total Assets</span>
                <Package style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div style={statNumberStyle}>{assets.length}</div>
              <div style={statMutedStyle}>Registered Physical Equipment</div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={statHeaderStyle}>
                <span style={statTitleStyle}>Active/Open Issues</span>
                <AlertTriangle style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div style={statNumberStyle}>
                {issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length}
              </div>
              <div style={statMutedStyle}>Awaiting Repair or Service</div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={statHeaderStyle}>
                <span style={statTitleStyle}>Out of Service / Critical</span>
                <AlertTriangle style={{ color: 'var(--accent-rose)' }} />
              </div>
              <div style={statNumberStyle}>
                {assets.filter(a => a.status === 'Out of Service' || a.condition === 'Critical Failure' || a.condition === 'Needs Immediate Maintenance').length}
              </div>
              <div style={statMutedStyle}>Require Immediate Action</div>
            </div>
          </>
        ) : (
          <>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={statHeaderStyle}>
                <span style={statTitleStyle}>Your Active Worklist</span>
                <Wrench style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div style={statNumberStyle}>
                {issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length}
              </div>
              <div style={statMutedStyle}>Pending Actions Required</div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={statHeaderStyle}>
                <span style={statTitleStyle}>Your Resolved Reputations</span>
                <CheckCircle2 style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div style={statNumberStyle}>
                {issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length}
              </div>
              <div style={statMutedStyle}>Maintenance History Completed</div>
            </div>
          </>
        )}
      </div>

      {/* Main Issue Catalog Section */}
      <section className="glass-card" style={{ padding: '2rem', marginTop: '2.5rem' }}>
        
        {/* Filtering and Header bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ color: 'var(--accent-cyan)' }} />
            {isAdmin ? 'Global Issues & Maintenance Catalog' : 'Your Assigned Maintenance Tickets'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isAdmin 
              ? 'Review reported tickets, select service technicians, and audit platform status updates.'
              : 'Follow work checklist: On-Site Inspection → Repair Phase → Log completion evidence.'}
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={toolbarStyle}>
          <div style={searchWrapperStyle}>
            <Search size={18} style={searchIconStyle} />
            <input
              type="text"
              placeholder="Search by Asset Name, Issue Title, Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          <div style={filterGroupStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={toolbarSelectStyle}
              >
                <option value="">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Assigned">Assigned</option>
                <option value="Inspection Started">Inspection Started</option>
                <option value="Maintenance In Progress">Maintenance In Progress</option>
                <option value="Waiting for Parts">Waiting for Parts</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={toolbarSelectStyle}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>


        {/* Global Notifications */}
        {error && (
          <div style={errorBannerStyle}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div style={successBannerStyle}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Work Order Cards Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading work orders...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={emptyStateStyle}>
            <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Issues Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              There are no reported issues matching the selected filters.
            </p>
          </div>
        ) : (
          <div style={cardsGridStyle}>
            {filteredIssues.map((issue) => {

              const isAssignedToSomebody = !!issue.assignedTechnicianId;
              const isAssignedToMe = issue.assignedTechnicianId?._id === user.id || issue.assignedTechnicianId === user.id;

              return (
                <div key={issue._id} className="glass-card" style={issueCardStyle}>
                  
                  {/* Card Header */}
                  <div style={issueCardHeaderStyle}>
                    <span style={issueCodeStyle}>{issue.issueNumber}</span>
                    <span className={`badge ${issue.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>
                      {issue.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={issueTitleStyle}>{issue.title}</h3>
                  <p style={issueDescStyle}>{issue.description.substring(0, 100)}{issue.description.length > 100 ? '...' : ''}</p>

                  {/* Asset Reference */}
                  <div style={assetReferenceBoxStyle}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Associated Equipment</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {issue.assetId?.name || 'Unknown Asset'} ({issue.assetId?.uniqueCode || 'N/A'})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <MapPin size={12} /> {issue.assetId?.location || 'No Location specified'}
                    </div>
                  </div>

                  {/* Card Metadata Footer */}
                  <div style={issueCardFooterStyle}>
                    <div style={{ flex: '1 1 50px' }}>
                      <div style={metaLabelStyle}>Priority</div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: issue.priority === 'Critical' ? 'var(--accent-rose)' : issue.priority === 'High' ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                      }}>
                        {issue.priority}
                      </div>
                    </div>
                    <div style={{ flex: '1 1 90px' }}>
                      <div style={metaLabelStyle}>Category</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{issue.category}</div>
                    </div>
                    <div style={{ flex: '1 1 80px' }}>
                      <div style={metaLabelStyle}>Reported By</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{issue.reporterName}</div>
                    </div>
                  </div>

                  {/* Action Layout based on Role */}
                  <div style={cardActionContainerStyle}>
                    
                    {/* Admin Actions: Assignment Selector */}
                    {isAdmin && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {issue.status === 'Reported' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <select
                              value={selectedTechs[issue._id] || ''}
                              onChange={(e) => setSelectedTechs({ ...selectedTechs, [issue._id]: e.target.value })}
                              style={techSelectStyle}
                            >
                              <option value="">Select Technician...</option>
                              {technicians.map(t => (
                                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                              ))}
                            </select>
                            
                            <button
                              onClick={() => handleAssignIssue(issue._id)}
                              disabled={assigningId === issue._id}
                              style={assignButtonStyle}
                            >
                              <UserPlus size={14} /> Assign Technician
                            </button>
                          </div>

                        ) : (
                          <div style={assignmentFeedbackStyle}>
                            <Check size={14} style={{ color: 'var(--accent-emerald)' }} />
                            Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{issue.assignedTechnicianId?.name || 'Technician'}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Technician Actions: Open progression/resolution details modal */}
                    {!isAdmin && (
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="btn-primary"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        Inspect & Process Work <ArrowRight size={14} />
                      </button>
                    )}

                    {/* Admins can also inspect/view resolved details */}
                    {isAdmin && issue.status === 'Resolved' && (
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        style={inspectResolvedButtonStyle}
                      >
                        Inspect Resolution Logs
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Display Detail & Workflow Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          token={token}
          onClose={() => setSelectedIssue(null)}
          onRefresh={() => {
            setSelectedIssue(null);
            fetchIssues();
          }}
        />
      )}

    </main>
  );
}

// Inline custom CSS matching globals variables
const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2.5rem',
};

const statHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const statTitleStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const statNumberStyle = {
  fontSize: '2.5rem',
  fontWeight: 800,
  marginBottom: '0.25rem',
  fontFamily: 'var(--font-heading)',
  color: 'var(--text-primary)',
};

const statMutedStyle = {
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
};

const refreshButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'background 0.2s',
  ':hover': {
    background: 'rgba(255,255,255,0.1)',
  }
};

const toolbarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.25rem',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: '1.5rem',
};

const searchWrapperStyle = {
  position: 'relative',
  flex: '1 1 300px',
  minWidth: '260px',
};

const searchIconStyle = {
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
};

const searchInputStyle = {
  width: '100%',
  padding: '10px 12px 10px 38px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.9rem',
};

const filterGroupStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  alignItems: 'center',
  flex: '1 1 auto',
  justifyContent: 'flex-end',
  minWidth: '280px',
};

const toolbarSelectStyle = {
  padding: '10px 14px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.85rem',
  cursor: 'pointer',
  minWidth: '150px',
};


const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
};

const issueCardStyle = {
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%',
  minHeight: '360px',
  background: 'rgba(17, 24, 39, 0.45)',
};

const issueCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
};

const issueCodeStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
};

const issueTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  marginBottom: '0.5rem',
  lineHeight: 1.3,
  color: 'var(--text-primary)',
};

const issueDescStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  marginBottom: '1.25rem',
};

const assetReferenceBoxStyle = {
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  marginBottom: '1.25rem',
};

const issueCardFooterStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px 16px',
  borderTop: '1px solid var(--border-color)',
  paddingTop: '1rem',
  marginBottom: '1.25rem',
};

const metaLabelStyle = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  fontWeight: 600,
  marginBottom: '2px',
};

const cardActionContainerStyle = {
  marginTop: 'auto',
  display: 'flex',
  width: '100%',
  position: 'relative',
  zIndex: 10,
};

const techSelectStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '0.85rem',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  outline: 'none',
  cursor: 'pointer',
  height: '42px',
};

const assignButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  background: 'var(--accent-primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  height: '42px',
  transition: 'opacity 0.2s',
};


const assignmentFeedbackStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  padding: '6px 8px',
  background: 'rgba(255,255,255,0.01)',
  borderRadius: '6px',
};

const inspectResolvedButtonStyle = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '0.8rem',
  fontWeight: 600,
  background: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  borderRadius: 'var(--radius-sm)',
  color: '#34d399',
  cursor: 'pointer',
};

const errorBannerStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(244, 63, 94, 0.15)',
  color: '#fda4af',
  border: '1px solid rgba(244, 63, 94, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  marginBottom: '1.5rem',
};

const successBannerStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#a7f3d0',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  marginBottom: '1.5rem',
};

const emptyStateStyle = {
  padding: '4rem 2rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};
