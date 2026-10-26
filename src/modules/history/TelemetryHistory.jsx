import React, { useState, useEffect } from 'react';
import { History, Trash2, Zap, Clock, ShieldCheck, Gauge, ArrowRight } from 'lucide-react';
import { getTelemetryHistory, clearTelemetryHistory } from '../../services/telemetryAggregator';
import { getBufferbloatHistory, clearBufferbloatHistory } from '../../services/bufferbloatService';

export function TelemetryHistory({ onRerun, onStartBufferbloat }) {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('bufferbloat'); // 'bufferbloat' or 'probes'

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
    <div className="history-workspace">
      <div className="history-header">
        <div>
          <h1 className="workspace-title">
            <History className="title-icon text-accent" size={22} />
            Test & Benchmark History
          </h1>
          <p className="workspace-subtitle">
            Local browser record of your bufferbloat grades, bandwidth throughput, and multi-region latency benchmarks.
          </p>
        </div>

        <div className="history-actions-row">
          {currentList.length > 0 && (
            <button 
              className="winui-btn winui-btn-subtle text-danger"
              onClick={handleClear}
            >
              <Trash2 size={14} /> Clear History
            </button>
          )}
        </div>
      </div>

      {/* History Tabs */}
      <div className="history-nav-pills">
        <button
          className={`history-pill-btn ${activeTab === 'bufferbloat' ? 'active' : ''}`}
          onClick={() => setActiveTab('bufferbloat')}
        >
          <Gauge size={14} />
          Bufferbloat Tests ({(history.bufferbloat || []).length})
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
          <div className="history-table-card winui-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>ISP / Autonomous System</th>
                  <th>Unloaded Latency</th>
                  <th>Download (Load Delta)</th>
                  <th>Upload (Load Delta)</th>
                  <th>Timestamp</th>
                  <th>Action</th>
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
                      <div className="bandwidth-stat-cell">
                        <span className="font-mono font-bold">{item?.download?.bandwidthMbps ?? item?.downloadMbps ?? '--'} Mbps</span>
                        <span className="delta-sub font-mono">
                          {item?.download?.latencyDelta != null ? `+${item.download.latencyDelta}ms` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="bandwidth-stat-cell">
                        <span className="font-mono font-bold">{item?.upload?.bandwidthMbps ?? item?.uploadMbps ?? '--'} Mbps</span>
                        <span className="delta-sub font-mono">
                          {item?.upload?.latencyDelta != null ? `+${item.upload.latencyDelta}ms` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="text-sm text-secondary">
                      {formatTimestamp(item?.timestamp)}
                    </td>
                    <td>
                      <button 
                        className="winui-btn winui-btn-subtle rerun-btn"
                        onClick={() => onStartBufferbloat ? onStartBufferbloat() : onRerun?.('1.1.1.1', 'ping')}
                        title="Re-run benchmark"
                      >
                        <Zap size={14} /> Re-test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-history-state winui-card">
            <Gauge size={40} className="text-muted" />
            <h3>No Bufferbloat Tests Recorded</h3>
            <p>Start a Bufferbloat & Latency Benchmark to assess your network's grade and active delay under load.</p>
            {onStartBufferbloat && (
              <button 
                className="winui-btn winui-btn-primary" 
                style={{ marginTop: '12px' }}
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
          <div className="history-table-card winui-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Autonomous System</th>
                  <th>Avg Latency</th>
                  <th>Duration</th>
                  <th>Recorded At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((item, idx) => (
                  <tr key={item?.id || idx}>
                    <td className="font-mono font-bold text-accent">{item?.target || '1.1.1.1'}</td>
                    <td>
                      <span className="type-badge">
                        {String(item?.type || 'PING').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="as-history-cell">
                        <strong>{item?.ripestat?.primaryAsn || 'N/A'}</strong>
                        <span className="as-holder-sub" title={item?.ripestat?.asHolder}>
                          {String(item?.ripestat?.asHolder || '').slice(0, 20)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item?.globalping?.avgLatency != null ? (
                        <span className="font-mono">{item.globalping.avgLatency}ms</span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="font-mono text-muted">{item?.durations?.total ?? '--'}ms</td>
                    <td className="text-sm text-secondary">
                      {formatTimestamp(item?.timestamp)}
                    </td>
                    <td>
                      <button 
                        className="winui-btn winui-btn-subtle rerun-btn"
                        onClick={() => onRerun?.(item?.target || '1.1.1.1', item?.type || 'ping')}
                        title="Re-run diagnostic"
                      >
                        <Zap size={14} /> Re-run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-history-state winui-card">
            <Clock size={40} className="text-muted" />
            <h3>No Diagnostic Probes Yet</h3>
            <p>Run a multi-region latency probe to view historical records here.</p>
          </div>
        )
      )}
    </div>
  );
}
