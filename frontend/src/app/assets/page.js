'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Package, Plus, Search, Filter, QrCode, Download, Copy, ExternalLink,
  MapPin, Tag, Calendar, CheckCircle2, AlertCircle, X, Shield, Eye
} from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQrAsset, setSelectedQrAsset] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    uniqueCode: '',
    category: 'HVAC / Cooling',
    location: 'Main Building - Floor 2',
    condition: 'Good',
    status: 'Operational',
    notes: '',
  });

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch Assets from Backend API
  const fetchAssets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let url = '/api/assets';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
      } else {
        setError(data.message || 'Failed to load assets');
      }
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Network error fetching asset catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAssets();
    }
  }, [token, search, statusFilter]);

  // Generate unique code helper
  const handleAutoGenerateCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, uniqueCode: `AST-EQP-${randomNum}` }));
  };

  // Submit New Asset Form
  const handleSubmitAsset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create asset');
      }

      setSuccess(`Asset '${data.asset.name}' (${data.asset.uniqueCode}) registered with QR code!`);
      setIsModalOpen(false);
      setSelectedQrAsset(data.asset); // Automatically show QR preview modal
      setFormData({
        name: '',
        uniqueCode: '',
        category: 'HVAC / Cooling',
        location: 'Main Building - Floor 2',
        condition: 'Good',
        status: 'Operational',
        notes: '',
      });
      fetchAssets();
    } catch (err) {
      setError(err.message || 'Error registering asset');
    }
  };

  // Copy link helper
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert(`Public Asset link copied to clipboard:\n${url}`);
  };

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading Asset Management Workspace...
      </div>
    );
  }

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package style={{ color: 'var(--accent-primary)' }} /> Asset Catalog & QR Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage physical equipment, generate dynamic QR codes, and monitor maintenance lifecycles.
          </p>
        </div>

        <button
          onClick={() => {
            handleAutoGenerateCode();
            setIsModalOpen(true);
          }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Register New Asset
        </button>
      </div>

      {/* Alert Messages */}
      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fda4af',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', items: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by asset name, code (AST-1001), or location..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Issue Reported">Issue Reported</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Out of Service">Out of Service</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Asset Grid Listing */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Fetching asset data & QR codes...
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Assets Found</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {search || statusFilter ? 'Try clearing your search or status filter.' : 'Register your first physical asset to generate its unique QR label.'}
          </p>
          <button
            onClick={() => {
              handleAutoGenerateCode();
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={16} /> Register Asset Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {assets.map((asset) => {
            const isOperational = asset.status === 'Operational';
            const isIssue = asset.status === 'Issue Reported';

            return (
              <div key={asset._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  
                  {/* Top Bar with Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        {asset.uniqueCode}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', marginTop: '6px' }}>{asset.name}</h3>
                    </div>

                    <span className={`badge ${isOperational ? 'badge-success' : isIssue ? 'badge-warning' : 'badge-info'}`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Metadata Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{asset.category}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{asset.location}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>Condition: <strong style={{ color: 'var(--accent-emerald)' }}>{asset.condition}</strong></span>
                    </div>
                  </div>

                </div>

                {/* Bottom Actions Bar */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedQrAsset(asset)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: 'var(--accent-primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <QrCode size={16} /> QR Label
                  </button>

                  <a
                    href={`/p/${asset.uniqueCode}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                    title="View Safe Public Asset Page"
                  >
                    <Eye size={16} /> Public View
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ASSET MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '2rem', position: 'relative' }}>
            
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package style={{ color: 'var(--accent-primary)' }} /> Register New Asset
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Every asset automatically receives a unique QR code linked to its safe public page.
            </p>

            <form onSubmit={handleSubmitAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Classroom Projector 01 / Main HVAC Unit"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Unique Code (Immutable) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.uniqueCode}
                    onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value.toUpperCase() })}
                    placeholder="AST-EQP-1001"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--accent-cyan)',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    <option value="HVAC / Cooling">HVAC / Cooling</option>
                    <option value="Audio / Visual Display">Audio / Visual Display</option>
                    <option value="Electrical & Generator">Electrical & Generator</option>
                    <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="Safety & Fire Protection">Safety & Fire Protection</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Facility Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Science Lab B - Room 204"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Initial Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
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
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Needs Immediate Maintenance">Needs Maintenance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    <option value="Operational">Operational</option>
                    <option value="Issue Reported">Issue Reported</option>
                    <option value="Under Inspection">Under Inspection</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '0.5rem' }}
              >
                Generate QR Code & Save Asset
              </button>

            </form>
          </div>
        </div>
      )}

      {/* QR PREVIEW & DOWNLOAD MODAL */}
      {selectedQrAsset && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center', position: 'relative' }}>
            
            <button
              onClick={() => setSelectedQrAsset(null)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <span className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
              <QrCode size={12} /> Print-Ready QR Asset Label
            </span>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>{selectedQrAsset.name}</h2>
            <p style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {selectedQrAsset.uniqueCode}
            </p>

            {/* QR Image Display */}
            {selectedQrAsset.qrDataUrl ? (
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <img
                  src={selectedQrAsset.qrDataUrl}
                  alt={`QR Code for ${selectedQrAsset.name}`}
                  style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '6px', fontWeight: 600, fontFamily: 'monospace' }}>
                  Scan to Access Safe Public Page
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Generating QR...</div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={selectedQrAsset.qrDataUrl}
                download={`${selectedQrAsset.uniqueCode}-QR.png`}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
              >
                <Download size={16} /> Download QR PNG
              </a>

              <button
                onClick={() => handleCopyLink(selectedQrAsset.publicUrl || `${window.location.origin}/p/${selectedQrAsset.uniqueCode}`)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Copy size={16} /> Copy Public Asset URL
              </button>

              <a
                href={`/p/${selectedQrAsset.uniqueCode}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '10px',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ExternalLink size={14} /> Open Public Asset Page
              </a>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
