'use me';
import React from 'react';
import { Activity, ShieldCheck, Cpu, QrCode, Database, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
          <Activity size={14} /> Phase 1 Foundation Active
        </div>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }}>
          Maintain<span className="gradient-text">IQ</span> Platform
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto' }}>
          AI-Powered QR Maintenance & Asset History System. Real-time tracking, safe public triage, and immutable audit logs.
        </p>
      </header>

      {/* Grid Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Backend Status Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
                <Cpu size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Express Backend</h3>
            </div>
            <span className="badge badge-success"><CheckCircle2 size={12} /> Ready</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Node.js server configured with security headers, CORS, logger, and structured routes.
          </p>
          <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
            GET http://localhost:5000/api/health
          </div>
        </div>

        {/* Database Status Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', color: 'var(--accent-emerald)' }}>
                <Database size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>MongoDB Core</h3>
            </div>
            <span className="badge badge-success"><CheckCircle2 size={12} /> Configured</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Mongoose connection utility initialized with auto-reconnection & environment fallback.
          </p>
          <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--accent-emerald)', fontFamily: 'monospace' }}>
            mongodb://localhost:27017/maintainiq
          </div>
        </div>

        {/* Next.js Frontend Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: 'var(--radius-md)', color: 'var(--accent-cyan)' }}>
                <QrCode size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Next.js Frontend</h3>
            </div>
            <span className="badge badge-success"><CheckCircle2 size={12} /> Active</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            App Router setup with custom CSS design tokens, responsive cards, and Lucide icons.
          </p>
          <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
            http://localhost:3000
          </div>
        </div>

      </div>

      {/* Architecture Highlights Section */}
      <section className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck style={{ color: 'var(--accent-primary)' }} /> Phase Roadmap & Prime Directives
        </h2>
        <ul style={{ color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', listStyle: 'none', marginTop: '1rem' }}>
          <li style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Phase 1: Foundation (Current)</strong><br />
            Backend API server, MongoDB connector, Next.js framework, and design tokens established.
          </li>
          <li style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Phase 2: Authentication & RBAC</strong><br />
            Administrator, Technician, and Public roles with backend authorization enforcement.
          </li>
          <li style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Phase 3: Assets & QR Mapping</strong><br />
            Asset codes, dynamic QR generator, and public page asset lookup.
          </li>
          <li style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Phase 4: AI Triage & History</strong><br />
            Gemini AI natural-language triage with user edit step & immutable history timeline.
          </li>
        </ul>
      </section>
    </main>
  );
}
