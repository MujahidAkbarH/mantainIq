'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Package, MapPin, Tag, Calendar, ShieldCheck, AlertTriangle,
  Clock, CheckCircle2, MessageSquarePlus, X, Sparkles, User, Mail,
  ListChecks, AlertCircle, Edit3, ArrowRight, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function PublicAssetViewPage() {
  const params = useParams();
  const rawCode = params?.uniqueCode || params?.code;

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);


  // Multi-Step Issue Reporting Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [triageStep, setTriageStep] = useState(1); // Step 1: Complaint Prompt, Step 2: Review/Edit Triage
  const [naturalComplaint, setNaturalComplaint] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'HVAC / Cooling',
    reporterName: '',
    reporterContact: '',
    possibleCauses: [],
    initialChecks: [],
    aiAssisted: false,
  });

  // Fetch Public Asset Details
  const fetchPublicAsset = async () => {
    if (!rawCode) return;
    try {
      const res = await fetch(`/api/public/assets/${rawCode}`);
      const data = await res.json();
      if (res.ok && data.success && data.asset) {
        setAsset(data.asset);
        setHistory(data.history || []);
        setIssueForm((prev) => ({ ...prev, category: data.asset.category }));
      }
 else {
        setError(data.message || `No equipment found matching code '${rawCode}'`);
      }
    } catch (err) {
      console.error('Error fetching public asset page:', err);
      setError('Network connection error. Failed to load public asset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicAsset();
  }, [rawCode]);

  // Step 1: Execute AI Triage Analysis
  const handleAnalyzeComplaint = async (e) => {
    e.preventDefault();
    if (!naturalComplaint || naturalComplaint.trim().length < 5) {
      alert('Please describe what is wrong with the equipment (minimum 5 characters).');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const res = await fetch('/api/public/ai-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: naturalComplaint,
          assetContext: {
            name: asset?.name,
            category: asset?.category,
            location: asset?.location,
            condition: asset?.condition,
          },
        }),
      });

      const data = await res.json();

      if (data.success && data.triage) {
        setIssueForm((prev) => ({
          ...prev,
          title: data.triage.title || naturalComplaint.slice(0, 40),
          description: naturalComplaint,
          category: data.triage.category || asset?.category || 'General',
          priority: data.triage.priority || 'Medium',
          possibleCauses: data.triage.possibleCauses || [],
          initialChecks: data.triage.initialChecks || [],
          aiAssisted: true,
        }));
        setAiSuccess(true);
      } else {
        // Fallback to manual entry
        setIssueForm((prev) => ({
          ...prev,
          title: naturalComplaint.slice(0, 40),
          description: naturalComplaint,
          category: asset?.category || 'General',
          priority: 'Medium',
          aiAssisted: false,
        }));
      }
      setTriageStep(2); // Proceed to Step 2: Review and Edit Suggestions
    } catch (err) {
      console.error('AI Triage error, using manual fallback:', err);
      // Fallback gracefully without blocking
      setIssueForm((prev) => ({
        ...prev,
        title: naturalComplaint.slice(0, 40),
        description: naturalComplaint,
        category: asset?.category || 'General',
        priority: 'Medium',
        aiAssisted: false,
      }));
      setTriageStep(2);
    } finally {
      setAiLoading(false);
    }
  };

  // Step 3: Final Submission
  const handleSubmitFinalIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          uniqueCode: asset.uniqueCode,
          ...issueForm,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit issue report');
      }

      setSubmitSuccess(data.issue);
      setAsset((prev) => ({ ...prev, status: 'Issue Reported' }));
      setIsReportModalOpen(false);
      setTriageStep(1);
      setNaturalComplaint('');
    } catch (err) {
      setError(err.message || 'Failed to submit issue report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Scanning QR Record & Fetching Public Asset Details...
      </div>
    );
  }

  if (error || !asset) {
    return (
      <main style={{ padding: '3rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <AlertTriangle size={48} style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Asset Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {error || `The requested QR code label '${rawCode}' is invalid or has been retired.`}
          </p>
          <Link href="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  const isOperational = asset.status === 'Operational';
  const isIssue = asset.status === 'Issue Reported';

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
          <ShieldCheck size={12} /> MaintainIQ Verified Public Record
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Public QR Portal • Mobile Safe View (No Auth Required)
        </div>
      </div>

      {/* Success Notification Alert */}
      {submitSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <CheckCircle2 size={28} style={{ margin: '0 auto 8px auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#34d399', marginBottom: '4px' }}>Issue Submitted Successfully!</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Ticket Code: <strong style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{submitSuccess.issueNumber}</strong>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Asset status updated to 'Issue Reported'. Maintenance technicians have been alerted.
          </p>
        </div>
      )}

      {/* Safe Public Asset Detail Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              {asset.uniqueCode}
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '10px' }}>{asset.name}</h1>
          </div>

          <span className={`badge ${isOperational ? 'badge-success' : isIssue ? 'badge-warning' : 'badge-info'}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            {isOperational ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {asset.status}
          </span>
        </div>

        {/* Safe Attributes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Tag size={14} /> Category
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.category}</div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <MapPin size={14} /> Location
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.location}</div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Clock size={14} /> Current Condition
            </div>
            <div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{asset.condition}</div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Calendar size={14} /> Last Serviced
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {new Date(asset.lastServiceDate).toLocaleDateString()}
            </div>
          </div>

        </div>

        {/* AI-Assisted Report Issue Action Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
            <Sparkles size={12} /> GenAI Powered Triage
          </div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Notice a Problem with this Equipment?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Describe the problem in your own words. Our AI assistant will automatically suggest priority levels, causes, and diagnostic checks for human review.
          </p>

          <button
            onClick={() => {
              setTriageStep(1);
              setIsReportModalOpen(true);
            }}
            className="btn-primary"
            style={{ width: '100%', maxWidth: '340px', padding: '12px', justifyContent: 'center' }}
          >
            <Sparkles size={18} /> Report Issue & Analyze with AI
          </button>
        </div>

        {/* RECENT ACTIVITY TIMELINE */}
        <div style={{ marginTop: '2rem', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
            Recent Activity Timeline
          </h3>

          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No service logs or action history recorded for this asset yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
              {history.map((log, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Dot bullet */}
                  <div style={{
                    position: 'absolute',
                    left: '-26px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-cyan)',
                    boxShadow: '0 0 8px var(--accent-cyan)',
                  }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>


      {/* MULTI-STEP AI TRIAGE REPORTING MODAL */}
      {isReportModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            
            <button
              onClick={() => setIsReportModalOpen(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* STEP 1: NATURAL LANGUAGE INPUT */}
            {triageStep === 1 && (
              <div>
                <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
                  <Sparkles size={12} /> Step 1: Natural Language Complaint
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>What is wrong with this equipment?</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Describe what you observed (e.g., <em>"The AC is leaking water, making unusual noise, and cooling is weak."</em>)
                </p>

                <form onSubmit={handleAnalyzeComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <textarea
                    required
                    rows={4}
                    value={naturalComplaint}
                    onChange={(e) => setNaturalComplaint(e.target.value)}
                    placeholder="Type complaint in plain English or Urdu... e.g. Display is flickering and HDMI port cuts out constantly during lab sessions."
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="btn-primary"
                      style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} /> Analyze Issue with AI
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIssueForm((prev) => ({
                          ...prev,
                          title: naturalComplaint || 'Equipment Malfunction',
                          description: naturalComplaint || '',
                          aiAssisted: false,
                        }));
                        setTriageStep(2);
                      }}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Skip AI Triage
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: HUMAN REVIEW AND EDIT AI SUGGESTIONS */}
            {triageStep === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`badge ${issueForm.aiAssisted ? 'badge-success' : 'badge-info'}`}>
                    {issueForm.aiAssisted ? <Sparkles size={12} /> : <Edit3 size={12} />}
                    {issueForm.aiAssisted ? 'AI Suggestions Populated (Review & Edit)' : 'Manual Entry Form'}
                  </span>

                  <button
                    onClick={() => setTriageStep(1)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ← Back to Prompt
                  </button>
                </div>

                <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Review & Confirm Report</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Verify or edit AI-suggested title, priority, causes, and diagnostic checks before submitting.
                </p>

                <form onSubmit={handleSubmitFinalIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Issue Title (Human Editable) *
                    </label>
                    <input
                      type="text"
                      required
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Suggested Priority *
                      </label>
                      <select
                        value={issueForm.priority}
                        onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.9rem',
                        }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical (Safety Hazard)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Category
                      </label>
                      <input
                        type="text"
                        value={issueForm.category}
                        onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Suggested Possible Causes */}
                  {issueForm.possibleCauses.length > 0 && (
                    <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ListChecks size={14} /> AI Suggested Possible Causes:
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {issueForm.possibleCauses.map((cause, idx) => (
                          <li key={idx}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Safe Initial Diagnostic Checks */}
                  {issueForm.initialChecks.length > 0 && (
                    <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} /> Recommended Safe Initial Checks:
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {issueForm.initialChecks.map((check, idx) => (
                          <li key={idx}>{check}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reporter Identity Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={issueForm.reporterName}
                        onChange={(e) => setIssueForm({ ...issueForm, reporterName: e.target.value })}
                        placeholder="Sarah Jenkins"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Email or Phone *
                      </label>
                      <input
                        type="text"
                        required
                        value={issueForm.reporterContact}
                        onChange={(e) => setIssueForm({ ...issueForm, reporterContact: e.target.value })}
                        placeholder="sarah@school.edu"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.9rem',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', marginTop: '0.5rem', justifyContent: 'center' }}
                  >
                    {submitting ? 'Submitting Reviewed Report...' : 'Confirm & Submit Issue Report'}
                  </button>

                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Safe Public Footer */}
      <footer style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
        MaintainIQ Mobile QR Gateway • Private technician notes & internal costs are hidden on public views.
      </footer>

    </main>
  );
}
