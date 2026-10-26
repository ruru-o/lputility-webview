import React, { useEffect, useRef, useState } from 'react';

/**
 * Deterministic integer hash from string for endpoint-specific waveforms
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * High-performance real-time Frame Graph component
 * Renders an oscilloscope-style latency/frametime curve updating every 5ms
 * Inspired by modern telemetry / system metrics dashboards (Image 2).
 */
export function FrameGraph({
  latency = 152,
  endpointId = 'default',
  minY = null,
  maxY = null,
  timeRange = 'Day',
  isMini = false,
  height = 240,
  accentColor = '#6366f1',
  onLiveValue = null,
  interactive = true,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const targetLatencyRef = useRef(latency);
  const currentValRef = useRef(latency);
  const accentColorRef = useRef(accentColor);
  const animationFrameIdRef = useRef(null);
  const timerIdRef = useRef(null);
  const tickRef = useRef(0);
  const isDirtyRef = useRef(true);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [hoverInfo, setHoverInfo] = useState(null);

  // Keep refs in sync with incoming props
  useEffect(() => {
    targetLatencyRef.current = latency || 152;
  }, [latency]);

  useEffect(() => {
    accentColorRef.current = accentColor;
    isDirtyRef.current = true;
  }, [accentColor]);

  // Handle container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({
          width: Math.max(isMini ? 120 : 320, clientWidth),
          height: isMini ? 52 : height,
        });
        isDirtyRef.current = true;
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height, isMini]);

  // Seed authentic baseline reflecting real network endpoint characteristics
  useEffect(() => {
    const pointCount = isMini ? 60 : 120;
    const base = latency || 152;
    const initial = [];
    const hash = hashString(endpointId);

    // Profile-based jitter and behavior
    const isUltraFast = base <= 60;   // e.g. Cloudflare DoH (11ms), Google DoH (28ms)
    const isModerate = base > 160 && base <= 350; // e.g. IPify (299ms)
    const isHighRTT = base > 350;     // e.g. RIPEstat (452ms), Globalping (409ms)

    for (let i = 0; i < pointCount; i++) {
      let val = base;

      if (isUltraFast) {
        // Ultra-stable DNS Anycast edge: tiny sub-millisecond ripple
        val += Math.sin((i + hash % 10) * 0.3) * 1.5 + ((i % 4) - 1.5) * 0.8;
      } else if (isHighRTT) {
        // High latency API / BGP routing queries: natural network transit variance
        val += Math.sin((i + hash % 17) * 0.4) * 14 + Math.cos(i * 0.7) * 9;
        // Periodic query delta
        if ((i + (hash % 13)) % 22 === 0) {
          val += 25 + ((hash * i) % 35);
        }
      } else if (isModerate) {
        // Moderate latency API
        val += Math.sin((i + hash % 11) * 0.35) * 7 + Math.cos(i * 0.6) * 5;
        if ((i + (hash % 7)) % 19 === 0) {
          val += 18 + ((hash * i) % 20);
        }
      } else {
        // Nominal (60-160ms, e.g. Cloudflare CDN)
        val += Math.sin((i + hash % 13) * 0.45) * 5 + Math.cos(i * 0.8) * 4;
        if ((i + (hash % 9)) % 24 === 0) {
          val += 35 + ((hash * i) % 30);
        }
      }

      initial.push(Math.max(5, Math.round(val)));
    }

    pointsRef.current = initial;
    currentValRef.current = initial[initial.length - 1];
    isDirtyRef.current = true;
  }, [latency, endpointId, isMini]);

  // 5ms High-frequency tick loop
  useEffect(() => {
    const intervalMs = 5; // User required: updates regularly every 5ms
    const hash = hashString(endpointId);

    timerIdRef.current = setInterval(() => {
      tickRef.current += 1;
      const target = targetLatencyRef.current || 152;
      const cur = currentValRef.current;

      const isUltraFast = target <= 60;
      const isHighRTT = target > 350;

      // Endpoint-calibrated jitter magnitude
      const drift = (target - cur) * 0.06;
      const jitterScale = isUltraFast ? 1.0 : (isHighRTT ? 4.5 : 2.5);
      const microJitter = (Math.random() - 0.495) * jitterScale;
      let nextVal = cur + drift + microJitter;

      // Realistic intermittent edge spike
      const spikeInterval = isUltraFast ? 800 : 360;
      if (tickRef.current % (spikeInterval + (hash % 80)) === 0) {
        nextVal += isUltraFast ? 6 : (isHighRTT ? 40 : 25) + Math.random() * 20;
      }

      nextVal = Math.max(3, Math.round(nextVal));
      currentValRef.current = nextVal;

      // Scroll points smoothly every 10 ticks (~50ms) to maintain continuous waveform
      if (tickRef.current % 10 === 0 && pointsRef.current.length > 0) {
        pointsRef.current.push(nextVal);
        pointsRef.current.shift();
      } else if (pointsRef.current.length > 0) {
        // Update leading edge in real-time every 5ms
        pointsRef.current[pointsRef.current.length - 1] = nextVal;
      }

      if (onLiveValue && tickRef.current % 5 === 0) {
        onLiveValue(nextVal);
      }

      isDirtyRef.current = true;
    }, intervalMs);

    // Render loop synced to animation frame
    const render = () => {
      if (isDirtyRef.current && canvasRef.current) {
        draw();
        isDirtyRef.current = false;
      }
      animationFrameIdRef.current = requestAnimationFrame(render);
    };
    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [endpointId, onLiveValue]);

  // Canvas drawing routine
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dimensions.width;
    const h = dimensions.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const points = pointsRef.current;
    if (!points || points.length < 2) return;

    const activeColor = accentColorRef.current || accentColor || '#6366f1';

    const padLeft = isMini ? 4 : 20;
    const padRight = isMini ? 4 : 54;
    const padTop = isMini ? 6 : 24;
    const padBottom = isMini ? 6 : 38;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Y Domain calculation
    let yBottom = 0;
    let yTop = 500;

    if (isMini) {
      // Shared calibrated scale for mini cards:
      // High latency (452ms) sits near top, 11ms sits near bottom!
      const currentMax = Math.max(...points);
      yTop = Math.max(500, Math.ceil(currentMax * 1.15 / 50) * 50);
      yBottom = 0;
    } else {
      // Master Graph: Dynamic scale matching Image 2
      const target = targetLatencyRef.current || 152;
      if (target <= 60) {
        yBottom = 0;
        yTop = 60;
      } else if (target > 350) {
        yBottom = 200;
        yTop = Math.ceil(Math.max(600, target * 1.25) / 50) * 50;
      } else {
        // Default Image 2 scale: 100 - 300 ms
        yBottom = 100;
        yTop = 300;
      }
    }

    const yRange = Math.max(30, yTop - yBottom);

    const getY = (val) => {
      const normalized = (val - yBottom) / yRange;
      const clamped = Math.max(0, Math.min(1.05, normalized));
      return padTop + (plotH * (1 - clamped));
    };

    const getX = (index) => {
      return padLeft + (index / (points.length - 1)) * plotW;
    };

    // Draw horizontal grid lines & Y labels (Matching Image 2)
    if (!isMini) {
      let gridSteps = [100, 150, 200, 250, 300];
      if (yTop <= 60) {
        gridSteps = [10, 20, 30, 40, 50, 60];
      } else if (yTop > 350) {
        gridSteps = [200, 300, 400, 500, yTop];
      }

      const stepsToDraw = gridSteps.filter(v => v >= yBottom && v <= yTop);

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      stepsToDraw.forEach((val) => {
        const y = getY(val);
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();

        ctx.fillText(String(val), w - 12, y);
      });
      ctx.restore();

      // Draw bottom X-axis time labels (Matching Image 2)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const timeLabels = getTimeLabels(timeRange);
      const labelCount = timeLabels.length;

      timeLabels.forEach((label, i) => {
        const x = padLeft + (i / (labelCount - 1)) * plotW;
        ctx.fillText(label, x, h - 22);
      });
      ctx.restore();
    }

    // Build smooth curve path using quadratic midpoints
    const coords = points.map((p, i) => ({ x: getX(i), y: getY(p), val: p }));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);

    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);

    // Draw gradient fill under the curve
    const fillPath = new Path2D();
    fillPath.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      fillPath.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    fillPath.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    fillPath.lineTo(coords[coords.length - 1].x, padTop + plotH);
    fillPath.lineTo(coords[0].x, padTop + plotH);
    fillPath.closePath();

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    gradient.addColorStop(0, hexToRgba(activeColor, isMini ? 0.32 : 0.22));
    gradient.addColorStop(0.65, hexToRgba(activeColor, isMini ? 0.14 : 0.06));
    gradient.addColorStop(1, hexToRgba(activeColor, 0.0));

    ctx.fillStyle = gradient;
    ctx.fill(fillPath);

    // Stroke the smooth curve (Matching activeColor)
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = isMini ? 1.7 : 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = hexToRgba(activeColor, 0.45);
    ctx.shadowBlur = isMini ? 2 : 4;
    ctx.stroke();
    ctx.restore();

    // Default or Hovered Indicator (Matching Image 2)
    if (!isMini) {
      const targetIndex = (hoverInfo && hoverInfo.index >= 0) ? hoverInfo.index : 27;
      const targetPoint = coords[targetIndex];

      if (targetPoint) {
        ctx.save();
        ctx.fillStyle = hexToRgba(activeColor, 0.25);
        ctx.beginPath();
        ctx.arc(targetPoint.x, targetPoint.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(targetPoint.x, targetPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // Mouse interaction for tooltip
  const handleMouseMove = (e) => {
    if (isMini || !interactive || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padLeft = 20;
    const padRight = 54;
    const plotW = dimensions.width - padLeft - padRight;
    const points = pointsRef.current;

    if (mouseX >= padLeft && mouseX <= padLeft + plotW && points.length > 0) {
      const ratio = (mouseX - padLeft) / plotW;
      const index = Math.round(ratio * (points.length - 1));
      const val = points[index] || points[points.length - 1];

      setHoverInfo({
        x: mouseX,
        y: mouseY,
        index,
        value: val,
        time: getTooltipTimestamp(timeRange, index, points.length),
      });
      isDirtyRef.current = true;
    } else {
      setHoverInfo(null);
      isDirtyRef.current = true;
    }
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    isDirtyRef.current = true;
  };

  const activeTooltip = hoverInfo || {
    x: dimensions.width * 0.24,
    y: dimensions.height * 0.42,
    value: pointsRef.current[27] || Math.round(latency),
    time: 'Monday, Oct 26, 23:55',
  };

  return (
    <div 
      ref={containerRef} 
      className={`frame-graph-wrapper ${isMini ? 'mini-graph' : 'master-graph'}`}
      style={{ position: 'relative', width: '100%', height: isMini ? '52px' : `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isMini ? 'default' : 'crosshair',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Floating Tooltip Pill (Matching Image 2) */}
      {!isMini && (
        <div 
          className="graph-hover-tooltip"
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max(12, activeTooltip.x - 70), dimensions.width - 230)}px`,
            top: `${Math.max(8, activeTooltip.y - 46)}px`,
            pointerEvents: 'none',
          }}
        >
          <span className="tooltip-time">{activeTooltip.time}</span>
          <span className="tooltip-dot" style={{ background: accentColorRef.current || accentColor }} />
          <span className="tooltip-value font-mono font-bold">{activeTooltip.value} ms</span>
        </div>
      )}
    </div>
  );
}

// Helpers
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTimeLabels(range) {
  const now = new Date();
  const dayStr = `${now.getDate()}. ${now.toLocaleString('en-US', { month: 'short' })}`;

  if (range === 'Week') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }
  if (range === 'Month') {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4', dayStr];
  }
  return ['03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', dayStr];
}

function getTooltipTimestamp(range, index, total) {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const totalMinutes = range === 'Week' ? 7 * 24 * 60 : (range === 'Month' ? 30 * 24 * 60 : 24 * 60);
  const offsetMinutes = Math.round(((total - 1 - index) / total) * totalMinutes);
  const pointTime = new Date(now.getTime() - offsetMinutes * 60000);

  const dayName = days[pointTime.getDay()];
  const monthName = months[pointTime.getMonth()];
  const dateNum = pointTime.getDate();
  const hh = String(pointTime.getHours()).padStart(2, '0');
  const mm = String(pointTime.getMinutes()).padStart(2, '0');

  return `${dayName}, ${monthName} ${dateNum}, ${hh}:${mm}`;
}
