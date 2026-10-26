import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Wifi, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { MONITORED_APIS, probeAllApis, probeApi } from '../../services/apiHealthService';

export function ApiHealthWorkspace() {
  const [apiStatuses, setApiStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [probingId, setProbingId] = useState(null);
  const autoRefreshTimerRef = useRef(null);

  const fetchStatuses = async () => {
    setIsLoading(true);
    try {
      const results = await probeAllApis();
      setApiStatuses(results);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Failed to probe APIs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const probeSingle = async (apiDef) => {
    setProbingId(apiDef.id);
    try {
      const updated = await probeApi(apiDef);
      setApiStatuses(prev => prev.map(item => item.id === apiDef.id ? updated : item));
    } finally {
      setProbingId(null);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
      return;
    }

    autoRefreshTimerRef.current = setInterval(() => {
      fetchStatuses();
    }, 10000); // 10 seconds interval

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh]);

  const onlineCount = apiStatuses.filter(s => s.status === 'online').length;
  const degradedCount = apiStatuses.filter(s => s.status === 'degraded').length;
  const offlineCount = apiStatuses.filter(s => s.status === 'offline').length;
  const avgFrametime = apiStatuses.length > 0
    ? Math.round(apiStatuses.reduce((acc, s) => acc + (s.frametime || 0), 0) / apiStatuses.length)
    : 0;

  const getStatusColor = (status) => {
    if (status === 'online') return '#10b981';
    if (status === 'degraded') return '#f59e0b';
    return '#ef4444';
  };

  const getFrametimeTag = (ft) => {
    if (ft <= 60) return { label: 'Ultra-Fast', class: 'ft-fast' };
    if (ft <= 150) return { label: 'Nominal', class: 'ft-nominal' };
    if (ft <= 350) return { label: 'Moderate', class: 'ft-moderate' };
    return { label: 'High RTT', class: 'ft-high' };
  };

  return (
    <div className="wf-benchmark-wrapper">
      {/* Top Header */}
      <div className="wf-top-bar">
        <div>
          <h1 className="wf-title">API Intelligence & Real-Time Status</h1>
          <p className="wf-subtitle">Live endpoint reachability, frametime metrics, and telemetry gateway latency.</p>
        </div>

        <div className="flex-row items-center gap-2">
          <button 
            className={`winui-btn winui-btn-subtle history-pill-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Toggle 10s auto-polling"
          >
            <span className={`status-dot ${autoRefresh ? 'dot-pulse' : ''}`} style={{ background: autoRefresh ? '#10b981' : '#64748b' }} />
            <span>{autoRefresh ? 'Auto-Polling (10s)' : 'Auto-Poll Paused'}</span>
          </button>

          <button 
            className="winui-btn winui-btn-primary"
            onClick={fetchStatuses}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            <span>Probe Now</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="api-overview-strip winui-card">
        <div className="api-overview-item">
          <span className="api-ov-label">System State</span>
          <div className="api-ov-val-wrap">
            <span className="status-dot" style={{ background: offlineCount === 0 ? '#10b981' : '#ef4444' }} />
            <span className="api-ov-val font-bold" style={{ color: offlineCount === 0 ? '#10b981' : '#ef4444' }}>
              {offlineCount === 0 ? 'All Gateways Operational' : `${offlineCount} Gateway Degradation`}
            </span>
          </div>
        </div>

        <div className="api-overview-item">
          <span className="api-ov-label">Active / Total</span>
          <span className="api-ov-val font-mono">
            <strong className="text-success">{onlineCount}</strong> / {MONITORED_APIS.length} Online
            {degradedCount > 0 && <span className="text-warning text-xs ml-1">({degradedCount} Degraded)</span>}
          </span>
        </div>

        <div className="api-overview-item">
          <span className="api-ov-label">Mean Gateway Frametime</span>
          <span className="api-ov-val font-mono text-accent">
            {avgFrametime > 0 ? `${avgFrametime} ms` : '--'}
          </span>
        </div>

        <div className="api-overview-item">
          <span className="api-ov-label">Last Synchronized</span>
          <span className="api-ov-val font-mono text-xs text-secondary">
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Initializing...'}
          </span>
        </div>
      </div>

      {/* Grid of API Cards */}
      <div className="api-cards-grid">
        {MONITORED_APIS.map((apiDef) => {
          const live = apiStatuses.find(s => s.id === apiDef.id) || {
            status: 'online',
            frametime: 45,
            httpStatus: 'Probing...',
            lastChecked: null,
          };
          const isProbing = probingId === apiDef.id || (isLoading && !apiStatuses.length);
          const ftInfo = getFrametimeTag(live.frametime || 50);

          return (
            <div key={apiDef.id} className="api-card winui-card">
              {/* Card Header */}
              <div className="api-card-top">
                <div className="api-card-title-wrap">
                  <div className="flex-row items-center gap-2">
                    <span 
                      className="status-dot" 
                      style={{ 
                        background: getStatusColor(live.status),
                        boxShadow: `0 0 8px ${getStatusColor(live.status)}88`
                      }} 
                    />
                    <h3 className="api-card-name">{apiDef.name}</h3>
                  </div>
                  <span className="api-provider-sub">{apiDef.provider}</span>
                </div>

                <div className="api-badges-row">
                  <span className={`api-status-badge badge-${live.status}`}>
                    {live.status.toUpperCase()}
                  </span>
                  <button 
                    className="copy-mini-btn"
                    onClick={() => probeSingle(apiDef)}
                    disabled={isProbing}
                    title="Probe this endpoint now"
                  >
                    <RefreshCw size={12} className={isProbing ? 'spin-icon' : ''} />
                  </button>
                </div>
              </div>

              {/* Purpose & Protocol */}
              <p className="api-role-text">{apiDef.role}</p>

              {/* Frametime & Latency Display */}
              <div className="api-frametime-box">
                <div className="flex-row justify-between items-baseline">
                  <span className="api-ft-label">Frametime / RTT</span>
                  <div className="flex-row items-center gap-2">
                    <span className={`api-ft-tag ${ftInfo.class}`}>{ftInfo.label}</span>
                    <span className="api-ft-val font-mono font-bold text-accent">
                      {isProbing ? '...' : `${live.frametime} ms`}
                    </span>
                  </div>
                </div>

                {/* Frametime Visualizer Track */}
                <div className="api-ft-track">
                  <div 
                    className="api-ft-fill" 
                    style={{ 
                      width: `${Math.min(100, Math.max(5, (live.frametime / 400) * 100))}%`,
                      background: getStatusColor(live.status)
                    }} 
                  />
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="api-card-footer">
                <div className="api-foot-item">
                  <span className="foot-k">Protocol:</span>
                  <span className="foot-v font-mono">{apiDef.protocol}</span>
                </div>
                <div className="api-foot-item">
                  <span className="foot-k">HTTP Code:</span>
                  <span className="foot-v font-mono">{live.httpStatus || '200 OK'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
