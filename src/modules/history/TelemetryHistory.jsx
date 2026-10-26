import React, { useState, useEffect } from 'react';
import { History, Trash2, Gauge, Clock, Zap } from 'lucide-react';
import { getTelemetryHistory, clearTelemetryHistory } from '../../services/telemetryAggregator';
import { getBufferbloatHistory, clearBufferbloatHistory } from '../../services/bufferbloatService';

export function TelemetryHistory({ onRerun, onStartBufferbloat }) {
  const [history, setHistory] = useState({ bufferbloat: [], probes: [] });
  const [activeTab, setActiveTab] = useState('bufferbloat');

  const loadData = () => {
    try {
      const bbHistory = getBufferbloatHistory() || [];
      const telHistory = getTelemetryHistory() || [];
      setHistory({
        bufferbloat: Array.isArray(bbHistory) ? bbHistory.filter(i => i && typeof i === 'object') : [],
        probes: Array.isArray(telHistory) ? telHistory.filter(i => i && typeof i === 'object') : [],
      });
    } catch (e) {
      console.error('Failed to load history:', e);
      setHistory({ bufferbloat: [], probes: [] });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClear = () => {
    try {
      clearBufferbloatHistory();
      clearTelemetryHistory();
      setHistory({ bufferbloat: [], probes: [] });
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  const formatTimestamp = (ts) => {
    try {
      if (!ts) return 'Recent';
      const d = new Date(ts);
      return isNaN(d.getTime()) ? 'Recent' : d.toLocaleString();
    } catch {
      return 'Recent';
    }
  };

  const getGradeBadgeClass = (grade) => {
    const g = String(grade || '').toUpperCase();
    if (g === 'A+' || g === 'A') return 'grade-badge-green';
    if (g === 'B') return 'grade-badge-lime';
    if (g === 'C') return 'grade-badge-yellow';
    if (g === 'D') return 'grade-badge-orange';
    return 'grade-badge-red';
  };

  const currentList = (history && history[activeTab]) || [];

  return (
    <div className="wf-benchmark-wrapper">
      {/* Top Bar */}
      <div className="wf-top-bar">
        <div>
          <h1 className="wf-title">Benchmark History</h1>
          <p className="wf-subtitle">Persistent local logs of past bufferbloat grades and latency tests.</p>
        </div>

        {currentList.length > 0 && (
          <button 
            className="winui-btn winui-btn-subtle text-danger"
            onClick={handleClear}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="history-nav-pills">
        <button
          className={`history-pill-btn ${activeTab === 'bufferbloat' ? 'active' : ''}`}
          onClick={() => setActiveTab('bufferbloat')}
        >
          <Gauge size={14} />
          Bufferbloat Benchmarks ({(history.bufferbloat || []).length})
        </button>
        <button
          className={`history-pill-btn ${activeTab === 'probes' ? 'active' : ''}`}
          onClick={() => setActiveTab('probes')}
        >
          <Zap size={14} />
          Diagnostic Probes ({(history.probes || []).length})
        </button>
      </div>

      {/* Bufferbloat List */}
      {activeTab === 'bufferbloat' && (
        currentList.length > 0 ? (
          <div className="winui-card wf-table-card">
            <div className="wf-table-wrap">
              <table className="wf-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>ISP & Network</th>
                    <th>Idle Ping</th>
                    <th>Download (Loaded)</th>
                    <th>Upload (Loaded)</th>
                    <th>Timestamp</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((item, idx) => (
                    <tr key={item?.id || idx}>
                      <td>
                        <span className={`grade-chip ${getGradeBadgeClass(item?.grade)}`}>
                          {item?.grade || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="as-history-cell">
                          <strong>{item?.ispContext?.asn || item?.ripestat?.primaryAsn || 'N/A'}</strong>
                          <span className="as-holder-sub" title={item?.ispContext?.holder || item?.target}>
                            {String(item?.ispContext?.holder || item?.ripestat?.asHolder || 'Local Edge').slice(0, 24)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-accent">
                          {item?.unloaded?.avg != null ? `${item.unloaded.avg} ms` : (item?.globalping?.avgLatency != null ? `${item.globalping.avgLatency} ms` : 'N/A')}
                        </span>
                      </td>
                      <td>
                        <div className="bandwidth-stat-cell font-mono">
                          <span className="font-bold">{item?.download?.bandwidthMbps ?? item?.downloadMbps ?? '--'} Mbps</span>
                          {item?.download?.latencyDelta != null && (
                            <span className="delta-sub font-mono">+{item.download.latencyDelta}ms</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="bandwidth-stat-cell font-mono">
                          <span className="font-bold">{item?.upload?.bandwidthMbps ?? item?.uploadMbps ?? '--'} Mbps</span>
                          {item?.upload?.latencyDelta != null && (
                            <span className="delta-sub font-mono">+{item.upload.latencyDelta}ms</span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-secondary font-mono">
                        {formatTimestamp(item?.timestamp)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="winui-btn winui-btn-subtle rerun-btn"
                          onClick={() => onStartBufferbloat ? onStartBufferbloat() : onRerun?.('1.1.1.1', 'ping')}
                          title="Run new test"
                        >
                          <Zap size={13} /> Re-test
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-history-state winui-card">
            <Gauge size={36} className="text-muted" />
            <h3 style={{ marginTop: '10px', fontSize: '1.1rem' }}>No Bufferbloat Tests Yet</h3>
            <p className="text-muted text-sm" style={{ margin: '6px 0 16px' }}>Run a test to record bufferbloat metrics here.</p>
            {onStartBufferbloat && (
              <button 
                className="winui-btn winui-btn-primary" 
                onClick={onStartBufferbloat}
              >
                Start Bufferbloat Test
              </button>
            )}
          </div>
        )
      )}

      {/* Probes List */}
      {activeTab === 'probes' && (
        currentList.length > 0 ? (
          <div className="winui-card wf-table-card">
            <div className="wf-table-wrap">
              <table className="wf-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Autonomous System</th>
                    <th>Latency</th>
                    <th>Duration</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((item, idx) => (
                    <tr key={item?.id || idx}>
                      <td className="font-mono font-bold text-accent">{item?.target || '1.1.1.1'}</td>
                      <td>
                        <span className="type-badge font-mono">
                          {String(item?.type || 'PING').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-sm">{item?.ripestat?.primaryAsn || 'N/A'}</span>
                      </td>
                      <td>
                        {item?.globalping?.avgLatency != null ? (
                          <span className="font-mono">{item.globalping.avgLatency} ms</span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="font-mono text-muted">{item?.durations?.total ?? '--'} ms</td>
                      <td className="text-sm text-secondary font-mono">
                        {formatTimestamp(item?.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-history-state winui-card">
            <Clock size={36} className="text-muted" />
            <h3 style={{ marginTop: '10px', fontSize: '1.1rem' }}>No Diagnostic Records</h3>
            <p className="text-muted text-sm">Past tests will appear here.</p>
          </div>
        )
      )}
    </div>
  );
}
