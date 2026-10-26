import React, { useEffect, useRef, useState } from 'react';

/**
 * High-performance real-time Frame Graph component
 * Renders an oscilloscope-style latency/frametime curve updating every 5ms
 * Inspired by modern telemetry / system metrics dashboards.
 */
export function FrameGraph({
  latency = 152,
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
  const animationFrameIdRef = useRef(null);
  const timerIdRef = useRef(null);
  const spikeCounterRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [hoverInfo, setHoverInfo] = useState(null);

  // Sync target latency
  useEffect(() => {
    targetLatencyRef.current = latency || 145;
  }, [latency]);

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
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height, isMini]);

  // Initialize data buffer
  useEffect(() => {
    const pointCount = isMini ? 60 : 120;
    const base = latency || 150;
    const initial = [];

    for (let i = 0; i < pointCount; i++) {
      // Natural initial distribution matching system metrics
      let val = base + (Math.sin(i * 0.35) * 6) + ((Math.random() - 0.5) * 8);
      // Occasional spikes mirroring realistic internet telemetry
      if (i === 18 || i === 42 || i === 75 || i === 98 || i === 112) {
        val += 50 + Math.random() * 60;
      }
      initial.push(Math.max(10, Math.round(val)));
    }

    pointsRef.current = initial;
    currentValRef.current = initial[initial.length - 1];
  }, [isMini]);

  // 5ms High-frequency tick loop
  useEffect(() => {
    const intervalMs = 5; // User required: updates regularly every 5ms
    let isDirty = true;

    timerIdRef.current = setInterval(() => {
      spikeCounterRef.current += 1;
      const target = targetLatencyRef.current || 150;
      const cur = currentValRef.current;

      // Smooth interpolation towards target with microsecond jitter
      const drift = (target - cur) * 0.08;
      const jitter = (Math.random() - 0.495) * 3.5;
      
      let nextVal = cur + drift + jitter;

      // Natural intermittent latency burst every ~500-800 ticks (~2.5 - 4s)
      if (spikeCounterRef.current % 700 === 0) {
        nextVal += 45 + Math.random() * 55;
      } else if (spikeCounterRef.current % 320 === 0) {
        nextVal += 20 + Math.random() * 30;
      }

      nextVal = Math.max(5, Math.round(nextVal));
      currentValRef.current = nextVal;

      if (pointsRef.current.length > 0) {
        pointsRef.current.push(nextVal);
        pointsRef.current.shift();
      }

      if (onLiveValue && spikeCounterRef.current % 10 === 0) {
        onLiveValue(nextVal);
      }

      isDirty = true;
    }, intervalMs);

    // Render loop synced to animation frame
    const render = () => {
      if (isDirty && canvasRef.current) {
        draw();
        isDirty = false;
      }
      animationFrameIdRef.current = requestAnimationFrame(render);
    };
    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [dimensions, onLiveValue]);

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

    const padLeft = isMini ? 4 : 20;
    const padRight = isMini ? 4 : 54; // Space for right Y-axis labels
    const padTop = isMini ? 6 : 24;
    const padBottom = isMini ? 6 : 38; // Space for bottom X-axis labels

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Calculate Y domain
    const minVal = minY !== null ? minY : Math.min(...points);
    const maxVal = maxY !== null ? maxY : Math.max(...points);

    // Standardize to Image 2 grid values if in range
    let yBottom = 100;
    let yTop = 300;

    if (maxVal > 300 || minVal < 70) {
      yBottom = Math.max(0, Math.floor(minVal / 50) * 50);
      yTop = Math.ceil(Math.max(maxVal * 1.15, yBottom + 100) / 50) * 50;
    }

    const yRange = Math.max(50, yTop - yBottom);

    const getY = (val) => {
      const normalized = (val - yBottom) / yRange;
      const clamped = Math.max(0, Math.min(1.05, normalized));
      return padTop + (plotH * (1 - clamped));
    };

    const getX = (index) => {
      return padLeft + (index / (points.length - 1)) * plotW;
    };

    // Draw horizontal grid lines & Y labels (only for master chart)
    if (!isMini) {
      const gridSteps = [100, 150, 200, 250, 300].filter(
        v => v >= yBottom && v <= yTop
      );
      
      const stepsToDraw = gridSteps.length >= 3 
        ? gridSteps 
        : [yBottom, yBottom + yRange * 0.25, yBottom + yRange * 0.5, yBottom + yRange * 0.75, yTop].map(Math.round);

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

      // Draw bottom X-axis time labels
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
    gradient.addColorStop(0, hexToRgba(accentColor, isMini ? 0.28 : 0.22));
    gradient.addColorStop(0.65, hexToRgba(accentColor, isMini ? 0.12 : 0.06));
    gradient.addColorStop(1, hexToRgba(accentColor, 0.0));

    ctx.fillStyle = gradient;
    ctx.fill(fillPath);

    // Stroke the smooth curve
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = isMini ? 1.5 : 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = hexToRgba(accentColor, 0.45);
    ctx.shadowBlur = isMini ? 2 : 4;
    ctx.stroke();
    ctx.restore();

    // Draw hover cursor and indicator if hovered
    if (!isMini && hoverInfo && hoverInfo.index >= 0 && hoverInfo.index < coords.length) {
      const targetPoint = coords[hoverInfo.index];

      ctx.save();
      // Vertical cursor line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(targetPoint.x, padTop);
      ctx.lineTo(targetPoint.x, padTop + plotH);
      ctx.stroke();

      // Outer glow circle
      ctx.fillStyle = hexToRgba(accentColor, 0.25);
      ctx.beginPath();
      ctx.arc(targetPoint.x, targetPoint.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Inner solid dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(targetPoint.x, targetPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
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
    } else {
      setHoverInfo(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
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
      {!isMini && hoverInfo && (
        <div 
          className="graph-hover-tooltip"
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max(10, hoverInfo.x - 90), dimensions.width - 210)}px`,
            top: `${Math.max(6, hoverInfo.y - 48)}px`,
            pointerEvents: 'none',
          }}
        >
          <span className="tooltip-time">{hoverInfo.time}</span>
          <span className="tooltip-dot" style={{ background: accentColor }} />
          <span className="tooltip-value font-mono font-bold">{hoverInfo.value} ms</span>
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
  // Default 'Day' matching Image 2 exactly:
  // 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 27. Oct
  return ['03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', dayStr];
}

function getTooltipTimestamp(range, index, total) {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate simulated relative time
  const totalMinutes = range === 'Week' ? 7 * 24 * 60 : (range === 'Month' ? 30 * 24 * 60 : 24 * 60);
  const offsetMinutes = Math.round(((total - 1 - index) / total) * totalMinutes);
  const pointTime = new Date(now.getTime() - offsetMinutes * 60000);

  const dayName = days[pointTime.getDay()];
  const monthName = months[pointTime.getMonth()];
  const dateNum = pointTime.getDate();
  const hh = String(pointTime.getHours()).padStart(2, '0');
  const mm = String(pointTime.getMinutes()).padStart(2, '0');

  // Format: "Monday, Oct 26, 23:55"
  return `${dayName}, ${monthName} ${dateNum}, ${hh}:${mm}`;
}
