import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import { MONITORED_APIS, probeAllApis, probeApi } from '../../services/apiHealthService';
import { FrameGraph } from '../../components/FrameGraph';

export function ApiHealthWorkspace() {
  const [apiStatuses, setApiStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [probingId, setProbingId] = useState(null);
  const [selectedApiId, setSelectedApiId] = useState('cloudflare-cdn');
  const [timeRange, setTimeRange] = useState('Day'); // 'Day' | 'Week' | 'Month'
  const [liveFrametime, setLiveFrametime] = useState(152);

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

  const probeSingle = async (apiDef, e) => {
    if (e) e.stopPropagation();
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
    }, 10000);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh]);

  const onlineCount = apiStatuses.filter(s => s.status === 'online').length;
  const degradedCount = apiStatuses.filter(s => s.status === 'degraded').length;
  const offlineCount = apiStatuses.filter(s => s.status === 'offline').length;
  
  // Find current selected API definition and live status
  const currentApiDef = MONITORED_APIS.find(a => a.id === selectedApiId) || MONITORED_APIS[0];
  const currentLiveStatus = apiStatuses.find(s => s.id === selectedApiId) || {
    frametime: 152,
    status: 'online',
    httpStatus: '200 OK'
  };

  const getStatusColor = (status) => {
    if (status === 'online') return '#10b981';
    if (status === 'degraded') return '#f59e0b';
    return '#ef4444';
  };

  const getFrametimeTag = (ft) => {
    if (ft <= 60) return { label: 'Ultra-Fast', class: 'ft-fast' };
    if (ft <= 160) return { label: 'Nominal', class: 'ft-nominal' };
    if (ft <= 350) return { label: 'Moderate', class: 'ft-moderate' };
    return { label: 'High RTT', class: 'ft-high' };
  };

  return (
    <div className="wf-benchmark-wrapper api-workspace-clean">
      {/* Top Header: System Metrics Title & Timeframe Selector (Matching Image 2) */}
      <div className="metrics-header-row">
        <div className="metrics-title-block">
          <span className="metrics-header-label">SYSTEM METRICS</span>
          <span className="metrics-sub-state">
            <span className="status-dot dot-pulse" style={{ background: offlineCount === 0 ? '#10b981' : '#f59e0b' }} />
            {offlineCount === 0 ? 'All Systems Operational' : `${offlineCount} Degradation Detected`}
          </span>
        </div>

        <div className="metrics-actions-right">
          {/* Day / Week / Month Pill Selector (Matching Image 2) */}
          <div className="timeframe-pill-group">
            {['Day', 'Week', 'Month'].map((range) => (
              <button
                key={range}
                className={`timeframe-pill-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <button 
            className={`winui-btn winui-btn-subtle history-pill-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Toggle 10s auto-polling"
          >
            <span className={`status-dot ${autoRefresh ? 'dot-pulse' : ''}`} style={{ background: autoRefresh ? '#10b981' : '#64748b' }} />
            <span>{autoRefresh ? '10s Poll' : 'Paused'}</span>
          </button>

          <button 
            className="winui-btn winui-btn-primary winui-btn-compact"
            onClick={fetchStatuses}
            disabled={isLoading}
            title="Probe all endpoints immediately"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
            <span>Probe</span>
          </button>
        </div>
      </div>

      {/* Primary Hero Card: API Response Time Frame Graph (Matching Image 2) */}
      <div className="master-frame-graph-card winui-card">
        <div className="graph-card-header">
          <div className="graph-title-area">
            <h2 className="graph-card-title">API Response Time</h2>
            <div className="endpoint-selector-tag">
              <span className="endpoint-selector-name">{currentApiDef.name}</span>
              <span className="endpoint-selector-provider">({currentApiDef.provider})</span>
            </div>
          </div>

          <div className="graph-metric-area">
            <span className="graph-live-ms font-mono font-bold">
              {liveFrametime || currentLiveStatus.frametime || 152} ms
            </span>
          </div>
        </div>

        {/* Real-time Oscilloscope Frame Graph updating every 5ms */}
        <FrameGraph
          latency={currentLiveStatus.frametime || 152}
          timeRange={timeRange}
          height={240}
          accentColor="#6366f1"
          onLiveValue={setLiveFrametime}
          interactive={true}
        />
      </div>

      {/* Simplified, Clean API Endpoints Grid */}
      <div className="api-section-subhead">
        <span className="subhead-title">Monitored Endpoints</span>
        <span className="subhead-meta font-mono text-secondary">
          {onlineCount}/{MONITORED_APIS.length} Online • Select endpoint to display in graph
        </span>
      </div>

      <div className="api-cards-grid simplified-grid">
        {MONITORED_APIS.map((apiDef) => {
          const live = apiStatuses.find(s => s.id === apiDef.id) || {
            status: 'online',
            frametime: 45,
            httpStatus: 'Probing...',
            lastChecked: null,
          };
          const isSelected = selectedApiId === apiDef.id;
          const isProbing = probingId === apiDef.id || (isLoading && !apiStatuses.length);
          const ftInfo = getFrametimeTag(live.frametime || 50);

          return (
            <div 
              key={apiDef.id} 
              className={`api-card winui-card simplified-card ${isSelected ? 'card-selected' : ''}`}
              onClick={() => setSelectedApiId(apiDef.id)}
              title="Click to graph this endpoint above"
            >
              {/* Header */}
              <div className="api-card-top">
                <div className="api-card-title-wrap">
                  <div className="flex-row items-center gap-2">
                    <span 
                      className="status-dot" 
                      style={{ 
                        background: getStatusColor(live.status),
                        boxShadow: `0 0 6px ${getStatusColor(live.status)}aa`
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
                    onClick={(e) => probeSingle(apiDef, e)}
                    disabled={isProbing}
                    title="Probe endpoint"
                  >
                    <RefreshCw size={11} className={isProbing ? 'spin-icon' : ''} />
                  </button>
                </div>
              </div>

              {/* Frametime Readout */}
              <div className="api-card-middle">
                <div className="flex-row justify-between items-baseline">
                  <span className="api-ft-label">Response Time</span>
                  <div className="flex-row items-center gap-2">
                    <span className={`api-ft-tag ${ftInfo.class}`}>{ftInfo.label}</span>
                    <span className="api-ft-val font-mono font-bold">
                      {isProbing ? '...' : `${live.frametime} ms`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Mini Frame Graph (Replaces the old static progress bar!) */}
              <div className="api-card-graph-wrap">
                <FrameGraph
                  latency={live.frametime || 50}
                  isMini={true}
                  height={50}
                  accentColor={getStatusColor(live.status)}
                  interactive={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
