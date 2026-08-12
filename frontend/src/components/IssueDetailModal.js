'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Wrench, Calendar, MapPin, User, AlertCircle, CheckCircle2,
  DollarSign, Upload, Sparkles, Info, AlertTriangle, Play, Check
} from 'lucide-react';

export default function IssueDetailModal({ issue, token, onClose, onRefresh }) {
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState('');
  const [cost, setCost] = useState('0');
  const [finalCondition, setFinalCondition] = useState('Good');
  const [evidenceFile, setEvidenceFile] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!issue?.assetId?.uniqueCode || !token) return;
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/assets/${issue.assetId.uniqueCode}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error('Failed to load asset history logs:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [issue, token]);


  // Handle status progression
  const handleProgressStatus = async (nextStatus) => {
    setLoadingStatus(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/issues/${issue._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Status successfully progressed to '${nextStatus}'.`);
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      setError('Network error progressing status');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Submit final resolution
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validations matching backend constraints
    if (!notes || notes.trim() === '') {
      setError("An issue cannot be marked 'Resolved' without a text note.");
      return;
    }

    const parsedCost = Number(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setError('Cost cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('notes', notes.trim());
      formData.append('partsReplaced', parts.trim());
      formData.append('cost', parsedCost);
      formData.append('finalCondition', finalCondition);
      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      const res = await fetch(`/api/issues/${issue._id}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Let browser set multipart boundary
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || 'Issue resolved successfully!');
        if (data.cloudinaryWarning) {
          console.warn(data.cloudinaryWarning);
        }
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to resolve issue');
      }
    } catch (err) {
      console.error(err);
      setError('Network error submitting resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Critical': return 'var(--accent-rose)';
      case 'High': return 'var(--accent-amber)';
      case 'Medium': return 'var(--accent-cyan)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div className="glass-card" style={modalContentStyle}>
        
        {/* Header */}
        <div style={modalHeaderStyle}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {issue.issueNumber} • {issue.category}
            </span>
            <h2 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{issue.title}</h2>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={modalBodyStyle}>
          {error && (
            <div style={errorAlertStyle}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div style={successAlertStyle}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Status</span>
              <span className={`badge ${issue.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>
                {issue.status}
              </span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Priority</span>
              <span style={{ fontWeight: 700, color: getPriorityColor(issue.priority), fontSize: '0.9rem' }}>
                {issue.priority}
              </span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Equipment</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {issue.assetId?.name || 'Unknown Asset'}
              </span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Location</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <MapPin size={12} /> {issue.assetId?.location || 'Unknown Location'}
              </span>
            </div>
          </div>

          {/* Issue Details Section */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Description & Report Details</h3>
            <p style={descriptionTextStyle}>{issue.description}</p>
            
            <div style={reporterCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <User size={14} /> Reported by: <strong style={{ color: 'var(--text-primary)' }}>{issue.reporterName}</strong>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', paddingLeft: '22px' }}>
                Contact: {issue.reporterContact}
              </div>
            </div>
          </div>

          {/* AI Assistance / Diagnostic Suggestions */}
          {issue.aiAssisted && (
            <div style={aiDiagnosticStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                <Sparkles size={16} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>AI Smart Diagnostics</h4>
              </div>
              
              {issue.possibleCauses?.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={aiLabelStyle}>Possible Root Causes:</div>
                  <ul style={aiListStyle}>
                    {issue.possibleCauses.map((cause, idx) => <li key={idx}>{cause}</li>)}
                  </ul>
                </div>
              )}

              {issue.initialChecks?.length > 0 && (
                <div>
                  <div style={aiLabelStyle}>Recommended Inspection Checks:</div>
                  <ul style={aiListStyle}>
                    {issue.initialChecks.map((check, idx) => <li key={idx}>{check}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Technician Workflow Controller */}
          {issue.status !== 'Resolved' && issue.status !== 'Closed' && (
            <div style={workflowBoxStyle}>
              <h3 style={sectionTitleStyle}>Work Progress Workflow</h3>
              
              {/* Stepper Status Indicators */}
              <div style={stepperStyle}>
                <div style={issue.status === 'Assigned' ? activeStepStyle : completedStepStyle}>
                  <div style={stepCircleStyle}>1</div>
                  <span>Assigned</span>
                </div>
                <div style={issue.status === 'Inspection Started' ? activeStepStyle : issue.status === 'Maintenance In Progress' ? completedStepStyle : pendingStepStyle}>
                  <div style={stepCircleStyle}>2</div>
                  <span>Inspection</span>
                </div>
                <div style={issue.status === 'Maintenance In Progress' ? activeStepStyle : pendingStepStyle}>
                  <div style={stepCircleStyle}>3</div>
                  <span>Maintenance</span>
                </div>
              </div>

              {/* Progress Buttons */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                {issue.status === 'Assigned' && (
                  <button
                    onClick={() => handleProgressStatus('Inspection Started')}
                    disabled={loadingStatus}
                    className="btn-primary"
                    style={{ width: '100%', maxWidth: '300px' }}
                  >
                    {loadingStatus ? 'Updating...' : 'Start On-Site Inspection'}
                  </button>
                )}
                {issue.status === 'Inspection Started' && (
                  <button
                    onClick={() => handleProgressStatus('Maintenance In Progress')}
                    disabled={loadingStatus}
                    className="btn-primary"
                    style={{ width: '100%', maxWidth: '300px', background: 'linear-gradient(135deg, var(--accent-amber) 0%, #d97706 100%)' }}
                  >
                    {loadingStatus ? 'Updating...' : 'Begin Repair/Maintenance'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resolution Form (Visible when work has progressed to Maintenance) */}
          {issue.status === 'Maintenance In Progress' && (
            <form onSubmit={handleResolveSubmit} style={resolveFormStyle}>
              <h3 style={{ ...sectionTitleStyle, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={16} /> Final Resolution Details
              </h3>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>Maintenance Action Notes *</label>
                <textarea
                  required
                  placeholder="Describe repairs, calibration adjustments, or work performed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={textareaStyle}
                  rows={3}
                />
              </div>

              <div style={rowStyle}>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Parts Replaced (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Air filter, Fuse, Compressor fan"
                    value={parts}
                    onChange={(e) => setParts(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Total Repair Cost ($) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={inputIconStyle} />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      style={inputWithIconStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={rowStyle}>
                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Equipment Post-Service Condition *</label>
                  <select
                    value={finalCondition}
                    onChange={(e) => setFinalCondition(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Needs Immediate Maintenance">Needs Immediate Maintenance</option>
                    <option value="Critical Failure">Critical Failure</option>
                  </select>
                </div>

                <div style={{ ...formGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Evidence Upload (Photo / Video)</label>
                  <div style={fileUploadContainerStyle}>
                    <input
                      type="file"
                      id="evidence-file"
                      accept="image/*,video/*"
                      onChange={(e) => setEvidenceFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="evidence-file" style={fileLabelStyle}>
                      <Upload size={16} />
                      {evidenceFile ? evidenceFile.name : 'Choose evidence file'}
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)' }}
              >
                {submitting ? 'Uploading & Resolving...' : 'Resolve & Close Work Order'}
              </button>
            </form>
          )}

          {/* Resolved History Record (Read Only if already resolved) */}
          {issue.status === 'Resolved' && (
            <div style={resolvedBoxStyle}>
              <h3 style={{ ...sectionTitleStyle, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Resolution Logs
              </h3>
              
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Work Notes:</strong>
                  <p style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{issue.maintenanceNotes || 'No notes left.'}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Cost:</strong> <span style={{ color: 'var(--text-primary)' }}>${issue.maintenanceCost || '0.00'}</span>
                  </div>
                  <div>
                    <strong>Parts Used:</strong> <span style={{ color: 'var(--text-primary)' }}>{issue.replacementParts || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Internal History Timeline */}
          <div style={{ ...sectionStyle, borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <h3 style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: 'var(--accent-cyan)' }} /> Asset Lifecycle & Activity History
            </h3>
            
            {loadingHistory ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading activity logs...</div>
            ) : history.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No actions recorded for this asset yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', marginLeft: '0.5rem', marginTop: '0.5rem', textAlign: 'left' }}>
                {history.map((log, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-21px',
                      top: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-cyan)',
                      boxShadow: '0 0 6px var(--accent-cyan)',
                    }} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Logged by: <strong style={{ color: 'var(--text-secondary)' }}>{log.actor}</strong> • {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Styling definitions
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1.5rem',
  backdropFilter: 'blur(8px)',
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '700px',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  padding: '2rem',
  background: 'var(--bg-glass)',
  border: '1px solid var(--bg-glass-border)',
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '1rem',
  marginBottom: '1.5rem',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
  ':hover': {
    background: 'rgba(255,255,255,0.05)',
  }
};

const modalBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const errorAlertStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(244, 63, 94, 0.15)',
  color: '#fda4af',
  border: '1px solid rgba(244, 63, 94, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
};

const successAlertStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#a7f3d0',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '10px',
};

const statBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 14px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
};

const statLabelStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginBottom: '4px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const sectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const descriptionTextStyle = {
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: 'var(--text-secondary)',
};

const reporterCardStyle = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(255, 255, 255, 0.01)',
  borderLeft: '3px solid var(--accent-primary)',
  marginTop: '4px',
};

const aiDiagnosticStyle = {
  background: 'rgba(6, 182, 212, 0.05)',
  border: '1px dashed rgba(6, 182, 212, 0.25)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem',
};

const aiLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--accent-cyan)',
  marginBottom: '4px',
};

const aiListStyle = {
  margin: 0,
  paddingLeft: '1.2rem',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
};

const workflowBoxStyle = {
  padding: '1.25rem',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
};

const stepperStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1rem',
  position: 'relative',
};

const activeStepStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  color: 'var(--accent-primary)',
  fontWeight: 600,
  fontSize: '0.8rem',
  gap: '6px',
};

const completedStepStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  color: 'var(--accent-emerald)',
  fontWeight: 600,
  fontSize: '0.8rem',
  gap: '6px',
};

const pendingStepStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
  color: 'var(--text-muted)',
  fontSize: '0.8rem',
  gap: '6px',
};

const stepCircleStyle = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'currentColor',
  color: 'var(--bg-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.75rem',
};

const resolveFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1.5rem',
  background: 'rgba(16, 185, 129, 0.03)',
  border: '1px solid rgba(16, 185, 129, 0.15)',
  borderRadius: 'var(--radius-md)',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
};

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const textareaStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const rowStyle = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap',
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-secondary)',
};

const inputWithIconStyle = {
  width: '100%',
  padding: '10px 12px 10px 32px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
};

const fileUploadContainerStyle = {
  border: '1px dashed var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-tertiary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px',
  height: '42px',
};

const fileLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'center',
};

const resolvedBoxStyle = {
  padding: '1.25rem',
  background: 'rgba(16, 185, 129, 0.05)',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  borderRadius: 'var(--radius-md)',
};
