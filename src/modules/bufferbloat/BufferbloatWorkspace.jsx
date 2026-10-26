import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  Play, 
  RotateCcw, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  Gamepad2, 
  Video, 
  Tv, 
  Server, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { runBufferbloatTest } from '../../services/bufferbloatService';

export function BufferbloatWorkspace({ onNavigateHistory }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null); // 'unloaded' | 'download' | 'upload' | 'context' | 'complete'
  const [phaseLabel, setPhaseLabel] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Live real-time readouts during test
  const [liveLatency, setLiveLatency] = useState(null);
  const [liveDownloadMbps, setLiveDownloadMbps] = useState(0);
  const [liveUploadMbps, setLiveUploadMbps] = useState(0);

  // Test Results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSqmHelp, setShowSqmHelp] = useState(false);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined') {
      window.__SET_MOCK_BUFFERBLOAT_RESULT = (mockRes) => {
        setResult(mockRes);
        setShowSqmHelp(true);
      };
    }
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
    setLiveDownloadMbps(0);
    setLiveUploadMbps(0);

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
        onLatencyUpdate: ({ current }) => {
          if (!isMountedRef.current) return;
          setLiveLatency(current);
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
          setError(err.message || 'The benchmark encountered an error.');
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
  };

  const getRatingIcon = (rating) => {
    if (rating === 'Flawless' || rating === 'Excellent') {
      return <CheckCircle2 size={16} className="text-success" />;
    }
    if (rating === 'Good' || rating === 'Fair') {
      return <AlertTriangle size={16} className="text-warning" />;
    }
    return <XCircle size={16} className="text-danger" />;
  };

  return (
    <div className="wf-benchmark-wrapper">
      {/* Top Bar */}
      <div className="wf-top-bar">
        <div>
          <h1 className="wf-title">Bufferbloat Test</h1>
          <p className="wf-subtitle">Waveform-equivalent benchmark measuring active latency spikes under bandwidth load.</p>
        </div>

        {onNavigateHistory && (
          <button 
            className="winui-btn winui-btn-subtle wf-history-btn"
            onClick={onNavigateHistory}
          >
            <Clock size={15} />
            <span>History</span>
          </button>
        )}
      </div>

      {/* Hero Benchmark Console */}
      <div className="winui-card wf-hero-card">
        {/* State 1: Active Test Running */}
        {isRunning && (
          <div className="wf-running-panel">
            {/* Stepper */}
            <div className="wf-stepper">
              <span className={`wf-step ${currentPhase === 'unloaded' ? 'active' : currentPhase ? 'done' : ''}`}>
                1. Idle Ping
              </span>
              <span className="wf-step-arrow">→</span>
              <span className={`wf-step ${currentPhase === 'download' ? 'active' : currentPhase === 'upload' || currentPhase === 'context' ? 'done' : ''}`}>
                2. Download Load
              </span>
              <span className="wf-step-arrow">→</span>
              <span className={`wf-step ${currentPhase === 'upload' ? 'active' : currentPhase === 'context' ? 'done' : ''}`}>
                3. Upload Load
              </span>
              <span className="wf-step-arrow">→</span>
              <span className={`wf-step ${currentPhase === 'context' ? 'active' : ''}`}>
                4. Results
              </span>
            </div>

            {/* Live Big Metric Readout */}
            <div className="wf-live-counter">
              {currentPhase === 'unloaded' && (
                <div className="wf-live-val-box">
                  <span className="wf-live-num font-mono">{liveLatency != null ? liveLatency : '--'}</span>
                  <span className="wf-live-unit">ms</span>
                  <span className="wf-live-tag">Baseline Ping</span>
                </div>
              )}

              {currentPhase === 'download' && (
                <div className="wf-live-val-box">
                  <span className="wf-live-num font-mono text-accent">{liveDownloadMbps > 0 ? liveDownloadMbps : '0.0'}</span>
                  <span className="wf-live-unit">Mbps</span>
                  <span className="wf-live-tag">Download Saturation</span>
                  {liveLatency != null && (
                    <span className="wf-live-sublatency font-mono">
                      Active Ping: <strong>{liveLatency} ms</strong>
                    </span>
                  )}
                </div>
              )}

              {currentPhase === 'upload' && (
                <div className="wf-live-val-box">
                  <span className="wf-live-num font-mono text-success">{liveUploadMbps > 0 ? liveUploadMbps : '0.0'}</span>
                  <span className="wf-live-unit">Mbps</span>
                  <span className="wf-live-tag">Upload Saturation</span>
                  {liveLatency != null && (
                    <span className="wf-live-sublatency font-mono">
                      Active Ping: <strong>{liveLatency} ms</strong>
                    </span>
                  )}
                </div>
              )}

              {currentPhase === 'context' && (
                <div className="wf-live-val-box">
                  <span className="wf-live-tag">Computing Grade & Network Context...</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="wf-progress-container">
              <div className="wf-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>

            <button className="winui-btn winui-btn-subtle wf-cancel-btn" onClick={handleCancel}>
              Cancel Test
            </button>
          </div>
        )}

        {/* State 2: Standby (Ready to Test) */}
        {!isRunning && !result && (
          <div className="wf-standby-panel">
            <div className="wf-standby-badge">
              <Gauge size={32} className="text-accent" />
            </div>
            <h2 className="wf-standby-heading">Check Your Network for Bufferbloat</h2>
            <p className="wf-standby-sub">
              Measures how much your ping increases while uploading or downloading files at full bandwidth.
            </p>

            <button className="wf-big-start-btn" onClick={handleStartTest}>
              <Play size={18} fill="currentColor" />
              <span>Start Test</span>
            </button>
          </div>
        )}

        {/* State 3: Benchmark Complete (Waveform Result Dashboard) */}
        {!isRunning && result && (
          <div className="wf-result-panel">
            {/* Grade Header */}
            <div className="wf-grade-header">
              <div 
                className="wf-grade-badge" 
                style={{ 
                  borderColor: result.gradeDetails.color,
                  color: result.gradeDetails.color,
                  boxShadow: `0 0 30px ${result.gradeDetails.color}35`,
                }}
              >
                {result.grade}
              </div>

              <div className="wf-grade-text">
                <div className="wf-grade-title-row">
                  <h2 className="wf-grade-title" style={{ color: result.gradeDetails.color }}>
                    Grade {result.grade}
                  </h2>
                  <span 
                    className="wf-grade-pill"
                    style={{
                      borderColor: `${result.gradeDetails.color}50`,
                      color: result.gradeDetails.color,
                      backgroundColor: `${result.gradeDetails.color}15`,
                    }}
                  >
                    {result.gradeDetails.title}
                  </span>
                </div>
                <p className="wf-grade-desc">
                  {result.gradeDetails.description}
                </p>
              </div>

              <button className="wf-retest-btn" onClick={handleStartTest}>
                <RotateCcw size={15} />
                <span>Test Again</span>
              </button>
            </div>

            {/* Waveform Metric Panels: Latency & Speed */}
            <div className="wf-metrics-duo">
              {/* Column 1: Latency (Core Bufferbloat metric) */}
              <div className="wf-metric-col winui-card">
                <div className="wf-col-header">
                  <span className="wf-col-title">Latency</span>
                  <span className="wf-col-unit">Milliseconds (RTT)</span>
                </div>

                <div className="wf-latency-rows">
                  <div className="wf-latency-item">
                    <span className="wf-lat-label">Unloaded (Idle)</span>
                    <span className="wf-lat-val font-mono">{result.unloaded.avg} ms</span>
                  </div>

                  <div className="wf-latency-item">
                    <div className="wf-lat-label-wrap">
                      <span className="wf-lat-label">Download Active</span>
                      <span className={`wf-delta-pill font-mono ${result.download.latencyDelta <= 15 ? 'delta-good' : 'delta-high'}`}>
                        +{result.download.latencyDelta} ms
                      </span>
                    </div>
                    <span className="wf-lat-val font-mono">{result.download.loadedLatency} ms</span>
                  </div>

                  <div className="wf-latency-item">
                    <div className="wf-lat-label-wrap">
                      <span className="wf-lat-label">Upload Active</span>
                      <span className={`wf-delta-pill font-mono ${result.upload.latencyDelta <= 15 ? 'delta-good' : 'delta-high'}`}>
                        +{result.upload.latencyDelta} ms
                      </span>
                    </div>
                    <span className="wf-lat-val font-mono">{result.upload.loadedLatency} ms</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Bandwidth Speed */}
              <div className="wf-metric-col winui-card">
                <div className="wf-col-header">
                  <span className="wf-col-title">Throughput Speed</span>
                  <span className="wf-col-unit">Megabits per second</span>
                </div>

                <div className="wf-speed-rows">
                  <div className="wf-speed-item">
                    <div className="wf-speed-label-wrap">
                      <ArrowDown size={18} className="text-accent" />
                      <span className="wf-speed-label">Download</span>
                    </div>
                    <div className="wf-speed-val-wrap font-mono">
                      <span className="wf-speed-num">{result.download.bandwidthMbps}</span>
                      <span className="wf-speed-unit">Mbps</span>
                    </div>
                  </div>

                  <div className="wf-speed-item">
                    <div className="wf-speed-label-wrap">
                      <ArrowUp size={18} className="text-success" />
                      <span className="wf-speed-label">Upload</span>
                    </div>
                    <div className="wf-speed-val-wrap font-mono">
                      <span className="wf-speed-num">{result.upload.bandwidthMbps}</span>
                      <span className="wf-speed-unit">Mbps</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Waveform Application Suitability Badges */}
            <div className="wf-suitability-strip">
              <div className="wf-app-chip">
                <Gamepad2 size={16} className="text-accent" />
                <span className="wf-app-name">Gaming:</span>
                {getRatingIcon(result.gradeDetails?.ratings?.gaming || 'Good')}
                <span className="wf-app-status">{result.gradeDetails?.ratings?.gaming || 'Good'}</span>
              </div>

              <div className="wf-app-chip">
                <Video size={16} className="text-success" />
                <span className="wf-app-name">Video Calls:</span>
                {getRatingIcon(result.gradeDetails?.ratings?.voip || 'Good')}
                <span className="wf-app-status">{result.gradeDetails?.ratings?.voip || 'Good'}</span>
              </div>

              <div className="wf-app-chip">
                <Tv size={16} className="text-warning" />
                <span className="wf-app-name">Streaming:</span>
                {getRatingIcon(result.gradeDetails?.ratings?.streaming || 'Good')}
                <span className="wf-app-status">{result.gradeDetails?.ratings?.streaming || 'Good'}</span>
              </div>
            </div>

            {/* Network Info Footer */}
            <div className="wf-net-footer">
              <div className="wf-net-item">
                <span className="net-k">ISP:</span>
                <span className="net-v font-mono">{result.ispContext?.holder || 'Detected Network'}</span>
              </div>
              <div className="wf-net-item">
                <span className="net-k">ASN:</span>
                <span className="net-v font-mono text-accent">{result.ispContext?.asn || 'AS9299'}</span>
              </div>
              <div className="wf-net-item">
                <span className="net-k">IP:</span>
                <span className="net-v font-mono">{result.ispContext?.ip || '49.144.0.176'}</span>
              </div>
              <div className="wf-net-item">
                <span className="net-k">Prefix:</span>
                <span className="net-v font-mono">{result.ispContext?.prefix || '49.144.0.0/19'}</span>
              </div>
            </div>

            {/* Structured Router Bufferbloat Guide */}
            <div className="wf-sqm-collapsible">
              <button 
                className="wf-sqm-toggle-btn"
                onClick={() => setShowSqmHelp(!showSqmHelp)}
              >
                <div className="flex-row items-center gap-2">
                  <Sliders size={16} className="text-accent" />
                  <span className="font-semibold">How to fix bufferbloat on your router</span>
                </div>
                {showSqmHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showSqmHelp && (
                <div className="wf-guide-body font-sans">
                  {/* Step 1: Quick Fix on Existing Router */}
                  <div className="wf-guide-section">
                    <h3 className="wf-guide-heading">
                      <span className="wf-step-number">1</span>
                      Quick Fix on Existing Router (Zero Cost)
                    </h3>
                    <p className="wf-guide-intro">
                      Most modern routers have basic bandwidth control or QoS that immediately reduces queue bloat:
                    </p>
                    <div className="wf-guide-cards-grid">
                      <div className="wf-guide-card">
                        <span className="wf-card-step">Step A</span>
                        <h4 className="wf-card-title">Open Router Admin</h4>
                        <p className="wf-card-text">
                          Open your browser and navigate to <code className="wf-code-inline">192.168.1.1</code> or <code className="wf-code-inline">192.168.0.1</code> to log into router settings.
                        </p>
                      </div>

                      <div className="wf-guide-card">
                        <span className="wf-card-step">Step B</span>
                        <h4 className="wf-card-title">Set 90% Bandwidth Cap</h4>
                        <p className="wf-card-text">
                          Find QoS or Bandwidth Limiter. Set Download and Upload caps to 90% of your tested speeds. This prevents modem queue accumulation.
                        </p>
                      </div>

                      <div className="wf-guide-card">
                        <span className="wf-card-step">Step C</span>
                        <h4 className="wf-card-title">Direct Cat6 Ethernet</h4>
                        <p className="wf-card-text">
                          Use a direct Ethernet cable for gaming or calls. Wi-Fi packet contention adds 15ms to 50ms of uncontrolled airtime jitter.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Routers with Built-in SQM */}
                  <div className="wf-guide-section" style={{ marginTop: '12px' }}>
                    <h3 className="wf-guide-heading">
                      <span className="wf-step-number">2</span>
                      Recommended Routers with Built-in SQM (CAKE / FQ-CoDel)
                    </h3>
                    <p className="wf-guide-intro">
                      If your stock router lacks QoS, these routers provide native Smart Queue Management out of the box:
                    </p>

                    <div className="wf-router-grid">
                      <div className="wf-router-card">
                        <div className="wf-router-head">
                          <span className="wf-router-name">eero 6+ / Pro 6E</span>
                          <span className="wf-router-badge badge-easiest">Easiest App Setup</span>
                        </div>
                        <p className="wf-router-desc">
                          1-tap toggle in the eero mobile app (eero Labs &gt; "Optimize for Conferencing and Gaming"). Zero configuration needed.
                        </p>
                        <div className="wf-router-meta">Whole-Home Mesh • Plug and Play</div>
                      </div>

                      <div className="wf-router-card">
                        <div className="wf-router-head">
                          <span className="wf-router-name">GL.iNet Flint 2 (GL-MT6000)</span>
                          <span className="wf-router-badge badge-value">Best Value OpenWrt</span>
                        </div>
                        <p className="wf-router-desc">
                          Ships pre-installed with OpenWrt and CAKE SQM toggle in the web dashboard. Easily handles up to 900 Mbps SQM throughput.
                        </p>
                        <div className="wf-router-meta">Dual 2.5G Ports • Wi-Fi 6 • ~$150</div>
                      </div>

                      <div className="wf-router-card">
                        <div className="wf-router-head">
                          <span className="wf-router-name">Ubiquiti UniFi Cloud Gateway Ultra</span>
                          <span className="wf-router-badge badge-pro">Dedicated Gateway</span>
                        </div>
                        <p className="wf-router-desc">
                          Compact gigabit gateway with built-in Smart Queues (FQ-CoDel). Connect between your modem and existing Wi-Fi APs.
                        </p>
                        <div className="wf-router-meta">Full 1 Gbps Routing • IDS/IPS • $129</div>
                      </div>

                      <div className="wf-router-card">
                        <div className="wf-router-head">
                          <span className="wf-router-name">ASUS RT-AX86U Pro</span>
                          <span className="wf-router-badge badge-gaming">Pro Gaming</span>
                        </div>
                        <p className="wf-router-desc">
                          High-performance router with Adaptive QoS. Can run Asuswrt-Merlin community firmware with Cake-qos script for line-rate queueing.
                        </p>
                        <div className="wf-router-meta">2.5G Port • Quad-Core CPU • Wi-Fi 6</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="winui-card wf-error-card">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
