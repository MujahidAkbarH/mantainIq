'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, LayoutDashboard, QrCode, Package } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            display: 'flex',
          }}>
            <QrCode size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            Maintain<span className="gradient-text">IQ</span>
          </span>
        </Link>

        {/* Auth Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
              }}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>

              <Link href="/assets" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}>
                <Package size={16} /> Asset Catalog
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
                <span className={`badge ${user.role === 'Admin' ? 'badge-warning' : 'badge-info'}`}>
                  {user.role === 'Admin' ? <Shield size={12} /> : <User size={12} />} {user.role}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px',
                    fontSize: '0.85rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 14px',
              }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Register Account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
