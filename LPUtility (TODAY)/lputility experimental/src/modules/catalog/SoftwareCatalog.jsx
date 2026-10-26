import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  X,
  Play,
  Code,
  GitBranch,
  Terminal,
  Database,
  Globe,
  Palette,
  BookOpen,
  MessageSquare,
  Box,
  Send,
  Coffee,
  FileText,
  Smartphone,
  AppWindow,
  Shield,
  Zap,
  Layers,
  CheckCircle2
} from 'lucide-react';
import catalogData from '../../data/catalog.json';
import bundlesData from '../../data/bundles.json';
import { EmbeddedInstallerModal } from './EmbeddedInstallerModal';

// Fallback icon resolver when an image fails to load
function getFallbackIcon(pkg) {
  const id = pkg.id;
  const cat = pkg.category;

  if (id === 'vscode' || id === 'pycharm-community' || id === 'intellij-community') return Code;
  if (id === 'git') return GitBranch;
  if (id === 'python' || id === 'nodejs' || id === 'putty') return Terminal;
  if (id === 'openjdk') return Coffee;
  if (id === 'notepadplusplus' || id === 'sublimetext') return FileText;
  if (id === 'androidstudio') return Smartphone;
  if (id === 'visualstudio-community') return AppWindow;
  if (cat === 'it-tools' && id.includes('sql') || id.includes('dbeaver') || id.includes('mongo')) return Database;
  if (id === 'wireshark' || id === 'nmap') return Shield;
  if (id === 'virtualbox') return Box;
  if (id === 'postman') return Send;
  if (cat === 'academic') return BookOpen;
  if (cat === 'creative') return Palette;
  if (cat === 'browsers') return Globe;
  if (cat === 'communication') return MessageSquare;

  return Layers;
}

// Aligned software .ico renderer (maintains native size & resolution)
function SoftwareIcon({ pkg }) {
  const [hasError, setHasError] = useState(false);
  const Fallback = getFallbackIcon(pkg);

  return (
    <div className="catalog-card-icon">
      {!hasError ? (
        <img
          src={`./icons/${pkg.id}.ico`}
          alt=""
          width={32}
          height={32}
          className="software-ico"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <Fallback size={18} style={{ color: 'var(--text-muted)' }} />
      )}
    </div>
  );
}

export function SoftwareCatalog({ 
  selectedPackages, 
  setSelectedPackages 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePresetId, setActivePresetId] = useState(null);
  const [copiedChoco, setCopiedChoco] = useState(false);
  const [launchedPowerShell, setLaunchedPowerShell] = useState(false);
  const [isEmbeddedModalOpen, setIsEmbeddedModalOpen] = useState(false);
  const [installedPackages, setInstalledPackages] = useState(new Set());

  const refreshInstalled = async () => {
    if (window.electronAPI?.getInstalledPackages) {
      try {
        const pkgs = await window.electronAPI.getInstalledPackages();
        setInstalledPackages(new Set(pkgs));
      } catch (e) {}
    }
  };

  useEffect(() => {
    refreshInstalled();
  }, []);

  const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'programming', label: 'Programming' },
    { id: 'it-tools', label: 'IT & Network' },
    { id: 'academic', label: 'Academic' },
    { id: 'creative', label: 'Creative' },
    { id: 'browsers', label: 'Browsers' },
    { id: 'communication', label: 'Communication' },
  ];

  // Filtering: only prioritize at top when a quick preset is active.
  // Manual card selection remains in-place without reordering!
  const displayedPackages = useMemo(() => {
    // 1. Filter packages by category and search term
    const filtered = catalogData.filter((pkg) => {
      const matchesCategory = activeCategory === 'all' || pkg.category === activeCategory;
      const matchesSearch = 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.chocoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // 2. If no quick preset is active, keep exact natural catalog order
    if (!activePresetId) {
      return filtered;
    }

    const activeBundle = bundlesData.find((b) => b.id === activePresetId);
    if (!activeBundle) {
      return filtered;
    }

    // 3. Quick preset active: prioritize that preset's packages at the very top
    const presetPkgs = [];
    const otherPkgs = [];
    const filteredMap = new Map(filtered.map((p) => [p.id, p]));

    for (const id of activeBundle.packageIds) {
      const pkg = filteredMap.get(id);
      if (pkg) {
        presetPkgs.push(pkg);
      }
    }

    for (const pkg of filtered) {
      if (!activeBundle.packageIds.includes(pkg.id)) {
        otherPkgs.push(pkg);
      }
    }

    return [...presetPkgs, ...otherPkgs];
  }, [searchTerm, activeCategory, activePresetId]);

  const selectedList = useMemo(() => {
    return catalogData.filter((p) => selectedPackages.includes(p.id));
  }, [selectedPackages]);

  const chocoCommand = useMemo(() => {
    if (selectedList.length === 0) return '';
    const chocoIds = selectedList.map((p) => p.chocoId).join(' ');
    return `choco install ${chocoIds} -y`;
  }, [selectedList]);

  const verifyCommands = useMemo(() => {
    if (selectedList.length === 0) return '';
    return selectedList.map((p) => p.verifyCommand).join('\n');
  }, [selectedList]);

  const togglePackage = (pkgId) => {
    if (selectedPackages.includes(pkgId)) {
      setSelectedPackages(selectedPackages.filter((id) => id !== pkgId));
    } else {
      setSelectedPackages([...selectedPackages, pkgId]);
    }
  };

  const clearAll = () => {
    setSelectedPackages([]);
    setActivePresetId(null);
  };

  // Quick preset toggle:
  // - If clicked preset is already active, REVERT cleanly back to default
  // - If clicked preset is not active, SWITCH cleanly to this preset (prioritizing preset tools at the top)
  const handleToggleBundle = (bundle) => {
    if (activePresetId === bundle.id) {
      // Revert: return to default
      setActivePresetId(null);
      setSelectedPackages([]);
    } else {
      // Switch cleanly to this quick preset
      setActivePresetId(bundle.id);
      setSelectedPackages([...bundle.packageIds]);
      if (activeCategory !== 'all') {
        setActiveCategory('all');
      }
      setSearchTerm('');
    }
  };

  const copyChoco = () => {
    if (!chocoCommand) return;
    navigator.clipboard.writeText(chocoCommand);
    setCopiedChoco(true);
    setTimeout(() => setCopiedChoco(false), 2000);
  };

  const runInPowerShell = async () => {
    if (!chocoCommand || !window.electronAPI?.runPowerShell) return;
    try {
      const chocoIds = selectedList.map((p) => p.chocoId);
      const packageNames = selectedList.map((p) => p.name);
      await window.electronAPI.runPowerShell({
        command: chocoCommand,
        packageIds: chocoIds,
        packageNames: packageNames,
      });
      setLaunchedPowerShell(true);
      setTimeout(() => setLaunchedPowerShell(false), 2500);
    } catch {
      // Fallback to copy if launch fails
      copyChoco();
    }
  };

  const downloadBatch = () => {
    if (!chocoCommand) return;
    const content = `@echo off\r\necho LPUtility\r\necho.\r\n${chocoCommand}\r\necho.\r\necho Verifying Installations...\r\n${verifyCommands}\r\necho.\r\necho Installation complete.\r\npause\r\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'install-tools.bat');
    link.click();
    URL.revokeObjectURL(url);
  };

  const isOverLimit = selectedPackages.length >= 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header & Clean Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
            Software Catalog
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Select software to generate an automated Chocolatey install command.
          </p>
        </div>

        {selectedPackages.length > 0 && (
          <button className="winui-btn winui-btn-subtle" onClick={clearAll} style={{ fontSize: '0.78rem' }}>
            <X size={13} />
            <span>Clear selection ({selectedPackages.length})</span>
          </button>
        )}
      </div>

      {/* Quick Bundles (Toggle Select / Revert to Default with Muted Crimson) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {bundlesData.map((bundle) => {
          const isSelected = activePresetId === bundle.id;

          return (
            <button
              key={bundle.id}
              className={`bundle-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggleBundle(bundle)}
              title={isSelected ? `Click to revert ${bundle.name} to default` : `Click to select ${bundle.name}`}
            >
              <span>{bundle.name}</span>
              {isSelected && <Check size={11} strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="winui-input"
            placeholder="Search software..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '28px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="winui-tabs" style={{ overflowX: 'auto' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`winui-tab-item ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Software Grid with Aligned .ico Icons (Prioritized at Top when Selected) */}
      <div className="catalog-grid">
        {displayedPackages.map((pkg) => {
          const isSelected = selectedPackages.includes(pkg.id);
          const isInstalled = 
            installedPackages.has(pkg.id.toLowerCase()) || 
            installedPackages.has(pkg.chocoId.toLowerCase()) || 
            installedPackages.has(`${pkg.chocoId.toLowerCase()}.install`);

          return (
            <div
              key={pkg.id}
              className={`catalog-card ${isSelected ? 'selected' : ''} ${isInstalled ? 'installed' : ''}`}
              onClick={() => togglePackage(pkg.id)}
            >
              {/* Aligned .ico Icon Container */}
              <SoftwareIcon pkg={pkg} />

              {/* Software Details */}
              <div className="catalog-card-body">
                <div className="catalog-card-header">
                  <span className="software-name">
                    {pkg.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isInstalled && (
                      <span title="Installed on system" style={{ color: '#10b981', display: 'flex' }}>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                      </span>
                    )}
                    <a 
                      href={pkg.officialUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--text-muted)', display: 'flex' }}
                      title="Official website"
                    >
                      <ExternalLink size={12} />
                    </a>
                    {isSelected && (
                      <span className="selected-check-badge">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="software-meta">
                  <span className="software-choco-id">
                    {pkg.chocoId}
                  </span>
                </div>

                <p className="software-desc">
                  {pkg.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Dock (Visible when packages are selected) */}
      {selectedPackages.length > 0 && (
        <div className="command-dock">
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                {selectedPackages.length} selected
              </span>
              {isOverLimit && (
                <span className="winui-badge winui-badge-brand" style={{ fontSize: '0.65rem' }}>
                  Over 20/min limit
                </span>
              )}
            </div>
            <div className="winui-codebox" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
              {chocoCommand}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {window.electronAPI?.runPowerShell ? (
              <>
                <button 
                  className="winui-btn winui-btn-primary" 
                  onClick={() => setIsEmbeddedModalOpen(true)} 
                  title="Install in-app with progressive bar, live backlogs, and checksum verification"
                  style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7', color: '#ffffff', fontWeight: 600, gap: '6px' }}
                >
                  <Zap size={13} style={{ fill: '#ffffff' }} />
                  <span>Install (In-App)</span>
                </button>

                <button 
                  className="winui-btn" 
                  onClick={runInPowerShell} 
                  title="Run external Chocolatey PowerShell CLI installer with loading and logs"
                  style={{ gap: '6px' }}
                >
                  {launchedPowerShell ? <Check size={12} /> : <Terminal size={12} />}
                  <span>{launchedPowerShell ? 'Launched!' : 'Install (CLI)'}</span>
                </button>

                <button className="winui-btn" onClick={copyChoco} title="Copy choco command">
                  {copiedChoco ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedChoco ? 'Copied' : 'Copy'}</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  className="winui-btn winui-btn-primary" 
                  onClick={() => setIsEmbeddedModalOpen(true)} 
                  title="Open installer preview with checksums and backlogs"
                  style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
                >
                  <Zap size={13} />
                  <span>Install Preview</span>
                </button>

                <button className="winui-btn" onClick={copyChoco} title="Copy choco command">
                  {copiedChoco ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedChoco ? 'Copied' : 'Copy'}</span>
                </button>
              </>
            )}

            <button className="winui-btn" onClick={downloadBatch} title="Download .bat installer script">
              <Download size={12} />
              <span>.BAT</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded In-App Installer Modal */}
      <EmbeddedInstallerModal 
        isOpen={isEmbeddedModalOpen}
        onClose={() => setIsEmbeddedModalOpen(false)}
        selectedList={selectedList}
        onSwitchToCLI={() => {
          setIsEmbeddedModalOpen(false);
          runInPowerShell();
        }}
        onInstalled={refreshInstalled}
      />
    </div>
  );
}
