import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  Play, 
  RotateCcw, 
  Wifi, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  Gamepad2, 
  PhoneCall, 
  Film, 
  ShieldCheck, 
  Server, 
  Zap, 
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { runBufferbloatTest, calculateBufferbloatGrade } from '../../services/bufferbloatService';
import { executeGlobalpingTest } from '../../services/globalping';

export function BufferbloatWorkspace({ onNavigateHistory }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null); // 'unloaded' | 'download' | 'upload' | 'context' | 'complete'
  const [phaseLabel, setPhaseLabel] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Live metrics during test
  const [liveLatency, setLiveLatency] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [liveDownloadMbps, setLiveDownloadMbps] = useState(0);
  const [liveUploadMbps, setLiveUploadMbps] = useState(0);

  // Final Test Results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Global Multi-Vantage Comparison state
  const [globalProbes, setGlobalProbes] = useState(null);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartTest = async () => {
    if (isRunning) return;

    setError(null);
    setIsRunning(true);
    setProgressPercent(0);
    setLiveLatency(null);
    setLatencyHistory([]);
    setLiveDownloadMbps(0);
    setLiveUploadMbps(0);
    setGlobalProbes(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await runBufferbloatTest({
        signal: controller.signal,
        onPhaseChange: ({ phase, label }) => {
          if (!isMountedRef.current) return;
          setCurrentPhase(phase);
          setPhaseLabel(label);
        },
        onProgress: ({ percent }) => {
          if (!isMountedRef.current) return;
          setProgressPercent(percent);
        },
        onLatencyUpdate: ({ current, samples }) => {
          if (!isMountedRef.current) return;
          setLiveLatency(current);
          setLatencyHistory(prev => [...prev.slice(-30), current]);
        },
        onBandwidthUpdate: ({ type, mbps }) => {
          if (!isMountedRef.current) return;
          if (type === 'download') setLiveDownloadMbps(mbps);
          if (type === 'upload') setLiveUploadMbps(mbps);
        },
      });

      if (isMountedRef.current) {
        setResult(res);
        setIsRunning(false);
        setCurrentPhase('complete');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsRunning(false);
        if (err.name !== 'AbortError' && !err.message?.includes('cancelled')) {
          setError(err.message || 'An error occurred during the bufferbloat benchmark.');
        }
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setCurrentPhase(null);
    setPhaseLabel('Test cancelled');
  };

  const handleRunGlobalComparison = async () => {
    if (isLoadingGlobal) return;
    setIsLoadingGlobal(true);
    try {
      const gp = await executeGlobalpingTest({
        type: 'ping',
        target: '1.1.1.1',
        locations: [
          { continent: 'EU', limit: 1 },
          { continent: 'NA', limit: 1 },
          { continent: 'AS', limit: 1 },
        ],
      });
      if (isMountedRef.current) {
        setGlobalProbes(gp.probes || []);
      }
    } catch (e) {
      console.warn('Globalping comparison failed:', e);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingGlobal(false);
      }
    }
  };

  return (
    <div className="bufferbloat-workspace">
      {/* Header */}
      <div className="workspace-header-row">
        <div>
          <h1 className="workspace-title">
            <Gauge className="title-icon text-accent" size={24} />
            Bufferbloat & Active Latency Benchmark
          </h1>
          <p className="workspace-subtitle">
            Waveform-equivalent bufferbloat grading. Evaluates unloaded idle ping against loaded latency under downstream and upstream saturation.
          </p>
        </div>

        {onNavigateHistory && (
          <button 
            className="winui-btn winui-btn-subtle"
            onClick={onNavigateHistory}
          >
            <Clock size={15} /> History
          </button>
        )}
      </div>

      {/* Main Testing Hero Card */}
      <div className="winui-card bufferbloat-hero-card">
        {/* Status / Active Test Bar */}
        {isRunning && (
          <div className="testing-active-banner">
            <div className="banner-top-row">
              <span className="phase-text font-bold text-accent">
                <Wifi size={16} className="pulse-icon" /> {phaseLabel}
              </span>
              <span className="percent-text font-mono">{progressPercent}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        )}

        {/* Grade Display or Standby Hero */}
        <div className="hero-center-content">
          {result ? (
            <div className="grade-result-container">
              <div 
                className="grade-circle" 
                style={{ 
                  borderColor: result.gradeDetails.color,
                  boxShadow: `0 0 35px ${result.gradeDetails.color}40`,
                }}
              >
                <span className="grade-letter" style={{ color: result.gradeDetails.color }}>
                  {result.grade}
                </span>
              </div>
              <h2 className="grade-title" style={{ color: result.gradeDetails.color }}>
                {result.gradeDetails.title}
              </h2>
              <p className="grade-description">
                {result.gradeDetails.description}
              </p>

              <div className="test-action-buttons">
                <button 
                  className="winui-btn winui-btn-primary start-test-btn"
                  onClick={handleStartTest}
                  disabled={isRunning}
                >
                  <RotateCcw size={16} /> Run Test Again
                </button>
              </div>
            </div>
          ) : (
            <div className="standby-hero-container">
              <div className="standby-icon-circle">
                <Gauge size={48} className="text-accent" />
              </div>
              <h2 className="standby-title">Test Your Network for Bufferbloat</h2>
              <p className="standby-subtitle">
                Bufferbloat happens when your router buffers excessive packets during downloads or uploads, causing severe in-game ping spikes, stutter, and choppy voice calls.
              </p>

              <div className="test-action-buttons">
                {!isRunning ? (
                  <button 
                    className="winui-btn winui-btn-primary start-test-btn"
                    onClick={handleStartTest}
                  >
                    <Play size={18} fill="currentColor" /> Start Testing
                  </button>
                ) : (
                  <button 
                    className="winui-btn winui-btn-subtle text-danger"
                    onClick={handleCancel}
                  >
                    Cancel Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Live Gauges during test */}
        {isRunning && (
          <div className="live-gauges-grid">
            <div className="live-gauge-item">
              <span className="gauge-label">Live Latency</span>
              <span className="gauge-value font-mono text-accent">
                {liveLatency != null ? `${liveLatency} ms` : '--'}
              </span>
            </div>
            <div className="live-gauge-item">
              <span className="gauge-label">Download Speed</span>
              <span className="gauge-value font-mono">
                {liveDownloadMbps > 0 ? `${liveDownloadMbps} Mbps` : '--'}
              </span>
            </div>
            <div className="live-gauge-item">
              <span className="gauge-label">Upload Speed</span>
              <span className="gauge-value font-mono">
                {liveUploadMbps > 0 ? `${liveUploadMbps} Mbps` : '--'}
              </span>
            </div>
          </div>
        )}

        {/* Live Sparkline Graph */}
        {latencyHistory.length > 3 && (
          <div className="latency-sparkline-wrap">
            <span className="sparkline-title text-sm text-secondary">
              Real-Time Latency Samples (ms)
            </span>
            <div className="sparkline-bars">
              {latencyHistory.map((val, idx) => {
                const max = Math.max(100, ...latencyHistory);
                const heightPercent = Math.min(100, Math.max(10, Math.round((val / max) * 100)));
                const isSpike = result?.unloaded?.avg ? val > result.unloaded.avg + 25 : val > 60;
                return (
                  <div 
                    key={idx} 
                    className={`sparkline-bar ${isSpike ? 'spike' : 'nominal'}`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${val} ms`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="winui-card error-banner">
          <AlertCircle size={20} className="text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Breakdown Grid */}
      {result && (
        <>
          <div className="bufferbloat-metrics-grid">
            {/* Unloaded Latency */}
            <div className="metric-box winui-card">
              <div className="metric-box-header">
                <Clock size={18} className="text-accent" />
                <span className="metric-box-title">Unloaded Latency (Idle)</span>
              </div>
              <div className="metric-main-val font-mono">
                {result.unloaded.avg} <span className="unit">ms</span>
              </div>
              <div className="metric-sub-stats font-mono text-sm">
                <span>Min: {result.unloaded.min}ms</span>
                <span>Max: {result.unloaded.max}ms</span>
                <span>Jitter: {result.unloaded.jitter}ms</span>
              </div>
              <p className="metric-footnote">Baseline round-trip time without network congestion.</p>
            </div>

            {/* Download Loaded Latency & Speed */}
            <div className="metric-box winui-card">
              <div className="metric-box-header">
                <ArrowDown size={18} className="text-success" />
                <span className="metric-box-title">Download Active Latency</span>
              </div>
              <div className="metric-main-val font-mono">
                {result.download.loadedLatency} <span className="unit">ms</span>
                <span className={`delta-tag font-mono ${result.download.latencyDelta <= 15 ? 'delta-good' : 'delta-high'}`}>
                  +{result.download.latencyDelta}ms
                </span>
              </div>
              <div className="metric-sub-stats font-mono text-sm">
                <span>Bandwidth: <strong>{result.download.bandwidthMbps} Mbps</strong></span>
              </div>
              <p className="metric-footnote">Ping measured while fully saturating your download pipe.</p>
            </div>

            {/* Upload Loaded Latency & Speed */}
            <div className="metric-box winui-card">
              <div className="metric-box-header">
                <ArrowUp size={18} className="text-accent" />
                <span className="metric-box-title">Upload Active Latency</span>
              </div>
              <div className="metric-main-val font-mono">
                {result.upload.loadedLatency} <span className="unit">ms</span>
                <span className={`delta-tag font-mono ${result.upload.latencyDelta <= 15 ? 'delta-good' : 'delta-high'}`}>
                  +{result.upload.latencyDelta}ms
                </span>
              </div>
              <div className="metric-sub-stats font-mono text-sm">
                <span>Bandwidth: <strong>{result.upload.bandwidthMbps} Mbps</strong></span>
              </div>
              <p className="metric-footnote">Ping measured while fully saturating your upload pipe.</p>
            </div>
          </div>

          {/* Application Ratings / Waveform Impact Cards */}
          <div className="ratings-cards-row">
            <div className="rating-card winui-card">
              <div className="rating-icon-wrap text-accent">
                <Gamepad2 size={24} />
              </div>
              <div className="rating-info">
                <span className="rating-app-name">Competitive Gaming</span>
                <span className="rating-verdict font-bold" style={{ color: result.gradeDetails.color }}>
                  {result.gradeDetails.ratings.gaming}
                </span>
                <span className="rating-desc text-sm text-secondary">
                  {result.grade === 'A+' || result.grade === 'A' 
                    ? 'Zero hit registration delays or rubber-banding while others download.' 
                    : 'Downloads by other household devices will cause in-game lag spikes.'}
                </span>
              </div>
            </div>

            <div className="rating-card winui-card">
              <div className="rating-icon-wrap text-success">
                <PhoneCall size={24} />
              </div>
              <div className="rating-info">
                <span className="rating-app-name">Video Calls & VoIP</span>
                <span className="rating-verdict font-bold" style={{ color: result.gradeDetails.color }}>
                  {result.gradeDetails.ratings.voip}
                </span>
                <span className="rating-desc text-sm text-secondary">
                  {result.grade === 'A+' || result.grade === 'A'
                    ? 'Crystal clear Zoom, Discord, and Teams calls with no audio cutouts.'
                    : 'Audio may stutter or become robotic during heavy background traffic.'}
                </span>
              </div>
            </div>

            <div className="rating-card winui-card">
              <div className="rating-icon-wrap text-warning">
                <Film size={24} />
              </div>
              <div className="rating-info">
                <span className="rating-app-name">4K & Cloud Streaming</span>
                <span className="rating-verdict font-bold" style={{ color: result.gradeDetails.color }}>
                  {result.gradeDetails.ratings.streaming}
                </span>
                <span className="rating-desc text-sm text-secondary">
                  Fast video buffering with continuous adaptive bitrate stability.
                </span>
              </div>
            </div>
          </div>

          {/* Autonomous System & ISP Context via RIPE Stat API */}
          {result.ispContext && (
            <div className="winui-card isp-context-card">
              <div className="isp-card-header">
                <div className="flex-row items-center gap-2">
                  <Server size={18} className="text-accent" />
                  <h3 className="card-subheading">Network & BGP Infrastructure Context (RIPE Stat API)</h3>
                </div>
                <span className="live-api-tag">RIPE Stat Data API</span>
              </div>

              <div className="isp-stats-grid">
                <div className="isp-stat-item">
                  <span className="stat-label">Public Edge IP</span>
                  <span className="stat-val font-mono">{result.ispContext.ip}</span>
                </div>
                <div className="isp-stat-item">
                  <span className="stat-label">Autonomous System (ASN)</span>
                  <span className="stat-val font-mono font-bold text-accent">{result.ispContext.asn}</span>
                </div>
                <div className="isp-stat-item">
                  <span className="stat-label">Network Holder / ISP</span>
                  <span className="stat-val font-mono">{result.ispContext.holder}</span>
                </div>
                <div className="isp-stat-item">
                  <span className="stat-label">BGP Routing Prefix</span>
                  <span className="stat-val font-mono">{result.ispContext.prefix}</span>
                </div>
              </div>
            </div>
          )}

          {/* Smart Queue Management (SQM) Actionable Guidance */}
          <div className="winui-card sqm-guidance-card">
            <h3 className="card-subheading flex-row items-center gap-2">
              <ShieldCheck size={18} className="text-accent" />
              How to Eliminate Bufferbloat (Smart Queue Management)
            </h3>
            <p className="sqm-intro text-sm text-secondary">
              Bufferbloat is solved at the router level by enabling <strong>Smart Queue Management (SQM)</strong> with <strong>CAKE</strong> or <strong>FQ-CoDel</strong> algorithms. SQM actively prevents packet queues from filling up by pacing traffic just beneath your physical line rate.
            </p>

            <div className="sqm-tips-grid">
              <div className="sqm-tip-item">
                <strong>1. Enable SQM in Router Settings</strong>
                <p className="text-sm text-secondary">Look for "Smart Queue Management", "QoS", or "Bufferbloat Protection" in OpenWrt, ASUS (Adaptive QoS), eero, or Ubiquiti UniFi.</p>
              </div>
              <div className="sqm-tip-item">
                <strong>2. Select CAKE or FQ-CoDel Algorithm</strong>
                <p className="text-sm text-secondary">CAKE is the modern standard; it automatically separates flows and prioritizes small latency-sensitive gaming packets.</p>
              </div>
              <div className="sqm-tip-item">
                <strong>3. Cap Ingress & Egress to ~90-95%</strong>
                <p className="text-sm text-secondary">Set download and upload limits to 90–95% of your measured ISP bandwidth so the router—not the ISP modem—controls the queue.</p>
              </div>
            </div>
          </div>

          {/* Multi-Continent Globalping Cross-Verification */}
          <div className="winui-card globalping-section-card">
            <div className="flex-row justify-between items-center">
              <div>
                <h3 className="card-subheading flex-row items-center gap-2">
                  <Zap size={18} className="text-accent" />
                  Multi-Region Globalping Verification
                </h3>
                <p className="text-sm text-secondary">
                  Compare your local latency against distributed probe vantage points across Europe, North America, and Asia.
                </p>
              </div>

              <button 
                className="winui-btn winui-btn-subtle"
                onClick={handleRunGlobalComparison}
                disabled={isLoadingGlobal}
              >
                {isLoadingGlobal ? 'Probing...' : 'Run Global Comparison'}
              </button>
            </div>

            {globalProbes && (
              <div className="global-probes-table-wrap" style={{ marginTop: '16px' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Vantage Region</th>
                      <th>Country</th>
                      <th>Probe ASN</th>
                      <th>Target Latency</th>
                      <th>Packet Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalProbes.map((p, idx) => (
                      <tr key={idx}>
                        <td className="font-bold text-accent">{p.city}, {p.continent}</td>
                        <td>{p.country}</td>
                        <td className="font-mono text-sm">{p.asn ? `AS${p.asn}` : 'N/A'} ({p.network})</td>
                        <td className="font-mono">{p.latency != null ? `${p.latency} ms` : 'N/A'}</td>
                        <td className="font-mono text-success">
                          {p.packetLoss === 0 ? '100% (0% loss)' : `${100 - (p.packetLoss || 0)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
