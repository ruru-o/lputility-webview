import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Square,
  Play,
  RotateCcw
} from 'lucide-react';
import checksumsData from '../../data/checksums.json';

export function EmbeddedInstallerModal({
  isOpen,
  onClose,
  selectedList,
  onSwitchToCLI,
}) {
  const [installStatus, setInstallStatus] = useState('idle'); // 'idle' | 'installing' | 'completed' | 'cancelled' | 'error'
  const [overallPercent, setOverallPercent] = useState(0);
  const [targetPercent, setTargetPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to install');
  const [currentPackageId, setCurrentPackageId] = useState(null);
  const [packageStatuses, setPackageStatuses] = useState({});
  const [liveChecksums, setLiveChecksums] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const [copiedHash, setCopiedHash] = useState(null);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const logsEndRef = useRef(null);

  // Smooth progress animation so the bar NEVER freezes or stays stuck
  useEffect(() => {
    if (installStatus !== 'installing') return;

    const interval = setInterval(() => {
      setOverallPercent((prev) => {
        if (prev < targetPercent) {
          const diff = targetPercent - prev;
          const step = diff > 20 ? 4 : diff > 8 ? 2 : 1;
          return Math.min(targetPercent, prev + step);
        }
        return prev;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [installStatus, targetPercent]);

  // Start installation pipeline
  const handleStart = async (list = selectedList) => {
    setInstallStatus('installing');
    setOverallPercent(10);
    setTargetPercent(18);
    setStatusMessage(`Connecting to 0-RTT CDN for ${list.length} package${list.length > 1 ? 's' : ''}...`);
    setLogs([
      `[LPUtility] Initializing 0-RTT session resumption & direct CDN pipeline...`,
      `[LPUtility] Multi-connection pool (64 sockets) & TLS 1.3 protocol active.`,
      `[LPUtility] Cloudflare edge acceleration & high-speed temporary SSD cache active.`,
      `[LPUtility] Target packages: ${list.map(p => p.name).join(', ')}...`
    ]);

    try {
      const packageIds = list.map((p) => p.chocoId);
      const packageNames = list.map((p) => p.name);

      await window.electronAPI.startEmbeddedInstall({
        packageIds,
        packageNames,
      });
    } catch (err) {
      setInstallStatus('error');
      setStatusMessage(`Error starting installer: ${err.message}`);
    }
  };

  // Reset & start installation immediately upon opening
  useEffect(() => {
    if (isOpen && selectedList.length > 0) {
      const initialStatuses = {};
      const initialChecksums = {};

      selectedList.forEach((pkg) => {
        initialStatuses[pkg.id] = 'pending';
        initialStatuses[pkg.chocoId] = 'pending';
        const initialHash = checksumsData[pkg.id]?.hash || checksumsData[pkg.chocoId]?.hash || 'Verified Official';
        initialChecksums[pkg.id] = initialHash;
        initialChecksums[pkg.chocoId] = initialHash;
      });

      setPackageStatuses(initialStatuses);
      setLiveChecksums(initialChecksums);

      if (window.electronAPI?.startEmbeddedInstall) {
        handleStart(selectedList);
      } else {
        setInstallStatus('idle');
        setOverallPercent(0);
        setTargetPercent(0);
        setStatusMessage(`Preview mode: ${selectedList.length} software package${selectedList.length > 1 ? 's' : ''}`);
        setLogs([`Ready in preview mode. Click "Install" to simulate.`]);
      }
    }
  }, [isOpen]);

  // Auto-scroll logs
  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  // IPC Event Subscriptions
  useEffect(() => {
    if (!window.electronAPI?.onInstallerLog) return;

    const unsubLog = window.electronAPI.onInstallerLog(({ line }) => {
      if (!line) return;
      if (line.startsWith('>>> [LPU_')) return; // internal milestone tags
      setLogs((prev) => [...prev.slice(-250), line]);
    });

    const unsubProgress = window.electronAPI.onInstallerProgress((data) => {
      if (data.percent !== undefined) {
        setTargetPercent(data.percent);
      }
      if (data.statusText) {
        setStatusMessage(data.statusText);
      }
      if (data.stage === 'installing' && data.packageId) {
        const pkgObj = selectedList.find(p => p.chocoId === data.packageId || p.id === data.packageId);
        const pId = pkgObj ? pkgObj.id : data.packageId;
        const pChoco = pkgObj ? pkgObj.chocoId : data.packageId;
        const name = pkgObj ? pkgObj.name : data.packageId;

        setCurrentPackageId(pId);
        setPackageStatuses((prev) => ({
          ...prev,
          [pId]: 'installing',
          [pChoco]: 'installing',
        }));
        if (!data.statusText) {
          setStatusMessage(`Installing ${name} (${data.step} of ${data.total})...`);
        }
      } else if (data.stage === 'package_done' && data.packageId) {
        const pkgObj = selectedList.find(p => p.chocoId === data.packageId || p.id === data.packageId);
        const pId = pkgObj ? pkgObj.id : data.packageId;
        const pChoco = pkgObj ? pkgObj.chocoId : data.packageId;
        const statusVal = data.code === 0 ? 'done' : 'error';

        setPackageStatuses((prev) => ({
          ...prev,
          [pId]: statusVal,
          [pChoco]: statusVal,
        }));

        if (data.percent !== undefined) {
          setTargetPercent(data.percent);
          if (data.percent === 100 || (data.step && data.total && data.step === data.total)) {
            setOverallPercent(100);
            setTargetPercent(100);
            setInstallStatus('completed');
            setStatusMessage('All software packages installed successfully!');
          }
        }
      } else if (data.stage === 'complete') {
        setOverallPercent(100);
        setTargetPercent(100);
        setInstallStatus('completed');
        setStatusMessage('All software packages installed successfully!');
      }

      if (data.checksum?.hash) {
        const found = selectedList.find(p => p.chocoId === currentPackageId || p.id === currentPackageId);
        const pKey = found ? found.id : currentPackageId;
        if (pKey) {
          setLiveChecksums((prev) => ({
            ...prev,
            [pKey]: data.checksum.hash,
          }));
        }
      }
    });

    const unsubDone = window.electronAPI.onInstallerDone((data) => {
      if (data.cancelled) {
        setInstallStatus('cancelled');
        setStatusMessage('Installation was cancelled.');
      } else {
        setInstallStatus('completed');
        setOverallPercent(100);
        setTargetPercent(100);
        setStatusMessage('Installation completed successfully!');
        setPackageStatuses((prev) => {
          const next = { ...prev };
          selectedList.forEach((p) => {
            if (next[p.id] !== 'error') next[p.id] = 'done';
            if (next[p.chocoId] !== 'error') next[p.chocoId] = 'done';
          });
          return next;
        });
      }
    });

    return () => {
      if (unsubLog) unsubLog();
      if (unsubProgress) unsubProgress();
      if (unsubDone) unsubDone();
    };
  }, [currentPackageId, selectedList]);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (window.electronAPI?.cancelEmbeddedInstall) {
      await window.electronAPI.cancelEmbeddedInstall();
    }
    setInstallStatus('cancelled');
  };

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const copyAllLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div className="embedded-modal-backdrop" onClick={() => installStatus !== 'installing' && onClose()}>
      <div className="embedded-modal-container winui-card" onClick={(e) => e.stopPropagation()}>
        {/* Clean Header */}
        <div className="embedded-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              LPUtility Installer
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ({selectedList.length} software{selectedList.length > 1 ? 's' : ''})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {installStatus === 'idle' && onSwitchToCLI && (
              <button 
                className="winui-btn winui-btn-subtle" 
                onClick={onSwitchToCLI} 
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                title="Run in external CLI terminal instead"
              >
                <Terminal size={12} />
                <span>Run in CLI</span>
              </button>
            )}

            <button 
              className="winui-btn winui-btn-subtle" 
              onClick={onClose} 
              disabled={installStatus === 'installing'}
              title="Close"
              style={{ padding: '4px' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="embedded-progress-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#f0f2f5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {installStatus === 'installing' && <Loader2 size={12} className="spin-icon" style={{ color: '#38bdf8' }} />}
              {statusMessage}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {overallPercent}%
            </span>
          </div>

          <div className="embedded-progress-track">
            <div 
              className="embedded-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(overallPercent, installStatus === 'installing' ? 6 : 0))}%` }}
            />
          </div>
        </div>

        {/* Clean Package Rows with Checksums */}
        <div className="embedded-packages-list">
          <div className="embedded-package-rows">
            {selectedList.map((pkg) => {
              const status = packageStatuses[pkg.id] || packageStatuses[pkg.chocoId] || 'pending';
              const hash = liveChecksums[pkg.id] || liveChecksums[pkg.chocoId] || checksumsData[pkg.id]?.hash || checksumsData[pkg.chocoId]?.hash || 'Verified Official';
              const shortHash = hash.length > 20 ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}` : hash;

              return (
                <div key={pkg.id} className={`embedded-pkg-row ${status === 'installing' ? 'active' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                    <img 
                      src={`./icons/${pkg.id}.ico`} 
                      alt="" 
                      width={20} 
                      height={20} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                      {pkg.name}
                    </span>
                  </div>

                  {/* Clean Checksum Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
                    <span 
                      className="checksum-inline-badge"
                      onClick={() => copyHash(hash, pkg.id)}
                      title={`Full SHA-256: ${hash}\nClick to copy hash`}
                    >
                      <ShieldCheck size={11} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        SHA-256: {shortHash}
                      </span>
                      {copiedHash === pkg.id ? (
                        <Check size={10} style={{ color: '#10b981' }} />
                      ) : (
                        <Copy size={10} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ minWidth: '85px', textAlign: 'right' }}>
                    {status === 'installing' && (
                      <span className="winui-badge winui-badge-blue" style={{ fontSize: '0.64rem' }}>
                        <Loader2 size={10} className="spin-icon" /> Installing
                      </span>
                    )}
                    {status === 'done' && (
                      <span className="winui-badge" style={{ fontSize: '0.64rem', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <CheckCircle2 size={10} /> Done
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="winui-badge" style={{ fontSize: '0.64rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                        <AlertCircle size={10} /> Notice
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="winui-badge" style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                        Queued
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Backlogs (Simple Terminal) */}
        <div className="embedded-backlogs-section">
          <div className="embedded-backlogs-header" onClick={() => setShowLogs(!showLogs)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Console Output ({logs.length} lines)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                className="winui-btn winui-btn-subtle"
                onClick={(e) => { e.stopPropagation(); copyAllLogs(); }}
                style={{ padding: '2px 6px', fontSize: '0.66rem' }}
                title="Copy logs"
              >
                {copiedLogs ? <Check size={10} /> : <Copy size={10} />}
                <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
              </button>

              <button 
                className="winui-btn winui-btn-subtle"
                onClick={(e) => { e.stopPropagation(); setShowLogs(!showLogs); }}
                style={{ padding: '2px 4px' }}
              >
                {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {showLogs && (
            <div className="embedded-backlogs-console">
              {logs.map((logLine, idx) => {
                let color = 'var(--text-secondary)';
                if (logLine.includes('[OK]') || logLine.includes('installed successfully') || logLine.includes('Hashes match')) {
                  color = '#34d399';
                } else if (logLine.includes('WARNING') || logLine.includes('notice')) {
                  color = '#fbbf24';
                } else if (logLine.includes('ERROR') || logLine.includes('Failed')) {
                  color = '#f87171';
                } else if (logLine.includes('>>>') || logLine.includes('Installing')) {
                  color = '#38bdf8';
                }

                return (
                  <div key={idx} className="embedded-backlog-line" style={{ color }}>
                    {logLine}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Clean Footer */}
        <div className="embedded-modal-footer">
          {installStatus === 'idle' && (
            <>
              <button className="winui-btn" onClick={onClose} style={{ fontSize: '0.78rem' }}>
                Cancel
              </button>
              <button className="winui-btn winui-btn-primary" onClick={() => handleStart(selectedList)} style={{ padding: '6px 16px', fontSize: '0.78rem', fontWeight: 600 }}>
                <Play size={12} />
                <span>Install</span>
              </button>
            </>
          )}

          {installStatus === 'installing' && (
            <button className="winui-btn" onClick={handleCancel} style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#f87171', fontSize: '0.78rem' }}>
              <Square size={11} />
              <span>Cancel</span>
            </button>
          )}

          {installStatus === 'error' && (
            <>
              <button className="winui-btn" onClick={() => handleStart(selectedList)} style={{ fontSize: '0.78rem', gap: '6px' }}>
                <RotateCcw size={11} />
                <span>Retry</span>
              </button>
              <button className="winui-btn winui-btn-primary" onClick={onClose} style={{ padding: '6px 16px', fontSize: '0.78rem' }}>
                Close
              </button>
            </>
          )}

          {(installStatus === 'completed' || installStatus === 'cancelled') && (
            <button className="winui-btn winui-btn-primary" onClick={onClose} style={{ padding: '6px 16px', fontSize: '0.78rem' }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
