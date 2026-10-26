import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowUpRight, Zap, RefreshCw, Activity, Server, Clock } from 'lucide-react';
import { getTelemetryHistory, clearTelemetryHistory } from '../../services/telemetryAggregator';

export function TelemetryHistory({ onRerun }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getTelemetryHistory());
  }, []);

  const handleClear = () => {
    clearTelemetryHistory();
    setHistory([]);
  };

  return (
    <div className="history-workspace">
      <div className="history-header">
        <div>
          <h1 className="workspace-title">
            <History className="title-icon text-accent" size={22} />
            Diagnostic Telemetry History
          </h1>
          <p className="workspace-subtitle">
            Local browser record of recent multi-region network measurements and BGP routing lookups.
          </p>
        </div>

        {history.length > 0 && (
          <button 
            className="winui-btn winui-btn-subtle text-danger"
            onClick={handleClear}
          >
            <Trash2 size={14} /> Clear History
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="history-table-card winui-card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Type</th>
                <th>Autonomous System</th>
                <th>Avg Latency</th>
                <th>Execution Time</th>
                <th>Recorded At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono font-bold text-accent">{item.target}</td>
                  <td>
                    <span className="type-badge">{item.type.toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="as-history-cell">
                      <strong>{item.ripestat?.primaryAsn || 'N/A'}</strong>
                      <span className="as-holder-sub" title={item.ripestat?.asHolder}>
                        {item.ripestat?.asHolder ? item.ripestat.asHolder.slice(0, 20) + '...' : ''}
                      </span>
                    </div>
                  </td>
                  <td>
                    {item.globalping?.avgLatency !== null ? (
                      <span className="font-mono">{item.globalping.avgLatency}ms</span>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td className="font-mono text-muted">{item.durations?.total}ms</td>
                  <td className="text-sm text-secondary">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <button 
                      className="winui-btn winui-btn-subtle rerun-btn"
                      onClick={() => onRerun(item.target, item.type)}
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
          <Clock size={36} className="text-muted" />
          <h3>No Telemetry History Yet</h3>
          <p>Run a live diagnostic from the Live Telemetry tab to save measurements here.</p>
        </div>
      )}
    </div>
  );
}
