import React, { useState, useEffect } from 'react'
import { Monitor, Palette, Type, Sliders, Info, RotateCcw, Download, Upload, Puzzle } from 'lucide-react'
import { useAppStore, Theme } from '../../store/appStore'
import { themeList } from '../Themes/themeDefinitions'
import { fontCombos } from '../Themes/fontDefinitions'

type SettingsSection = 'general' | 'appearance' | 'preferences' | 'shortcuts' | 'plugins' | 'about'

const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Monitor size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'preferences', label: 'Preferences', icon: <Sliders size={16} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Type size={16} /> },
  { id: 'plugins', label: 'Plugins', icon: <Puzzle size={16} /> },
  { id: 'about', label: 'About', icon: <Info size={16} /> },
]

const shortcuts = [
  { keys: 'Ctrl + Tab', action: 'Next tab' },
  { keys: 'Ctrl + Shift + Tab', action: 'Previous tab' },
  { keys: 'Ctrl + 1-9', action: 'Switch to tab by position' },
  { keys: 'Ctrl + W', action: 'Close current tab' },
  { keys: 'Ctrl + =', action: 'Zoom in' },
  { keys: 'Ctrl + -', action: 'Zoom out' },
  { keys: 'Ctrl + 0', action: 'Reset zoom' },
  { keys: 'Ctrl + Shift + W', action: 'Toggle width mode' },
  { keys: 'Ctrl + Shift + F', action: 'Toggle fullscreen' },
  { keys: 'Ctrl + Shift + B', action: 'Toggle sidebar' },
  { keys: 'Left / Right', action: 'Navigate between files' },
  { keys: 'F11', action: 'Fullscreen' },
  { keys: 'Ctrl + +', action: 'Zoom in' },
]

export const SettingsWindow: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const {
    currentTheme, setTheme,
    currentFont, setCurrentFont,
    contentWidth, toggleContentWidth,
    zoomLevel, setZoomLevel,
  } = useAppStore()

  const [localSettings, setLocalSettings] = useState({
    showSidebarOnStartup: true,
    autoHideHeader: true,
    smoothScrolling: true,
    showLineNumbers: false,
    pdfMargins: { top: 0.79, bottom: 0.79, left: 0.71, right: 0.71 },
  })

  // Relational always resets to true on mount — never persisted
  const [pdfMarginsRelational, setPdfMarginsRelational] = useState(true)

  // Load local settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('markdown-viewer-local-settings')
    if (saved) {
      try {
        setLocalSettings({ ...localSettings, ...JSON.parse(saved) })
      } catch {}
    }
  }, [])

  const saveLocalSettings = (newSettings: typeof localSettings) => {
    setLocalSettings(newSettings)
    localStorage.setItem('markdown-viewer-local-settings', JSON.stringify(newSettings))
  }

  const handleResetAll = () => {
    localStorage.clear()
    window.location.reload()
  }

  const handleExportSettings = () => {
    const settings = {
      theme: currentTheme,
      font: currentFont,
      contentWidth,
      zoomLevel,
      localSettings,
    }
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-viewer-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const settings = JSON.parse(text)
        if (settings.theme) { setTheme(settings.theme); handleSettingChange('theme', settings.theme) }
        if (settings.font) { setCurrentFont(settings.font); handleSettingChange('font', settings.font) }
        if (settings.contentWidth) { useAppStore.setState({ contentWidth: settings.contentWidth }); handleSettingChange('contentWidth', settings.contentWidth) }
        if (settings.zoomLevel) { setZoomLevel(settings.zoomLevel); handleSettingChange('zoomLevel', settings.zoomLevel) }
        if (settings.localSettings) {
          setLocalSettings(settings.localSettings)
          localStorage.setItem('markdown-viewer-local-settings', JSON.stringify(settings.localSettings))
        }
      } catch {
        alert('Invalid settings file')
      }
    }
    input.click()
  }

  const handleSettingChange = (key: string, value: any) => {
    window.electronAPI?.sendSettingsChanged({ key, value })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <div style={{
        width: '220px',
        borderRight: '1px solid var(--border-color)',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '16px',
      }}>
        <div style={{
          padding: '0 16px 16px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '8px',
        }}>
          Settings
        </div>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              backgroundColor: activeSection === section.id ? 'var(--accent-color)' : 'transparent',
              color: activeSection === section.id ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {activeSection === 'general' && (
          <GeneralSection
            localSettings={localSettings}
            saveLocalSettings={saveLocalSettings}
          />
        )}
        {activeSection === 'appearance' && (
          <AppearanceSection
            currentTheme={currentTheme}
            setTheme={(t) => { setTheme(t); handleSettingChange('theme', t) }}
            currentFont={currentFont}
            setCurrentFont={(f) => { setCurrentFont(f); handleSettingChange('font', f) }}
            contentWidth={contentWidth}
            toggleContentWidth={() => { toggleContentWidth(); handleSettingChange('contentWidth', useAppStore.getState().contentWidth) }}
            zoomLevel={zoomLevel}
            setZoomLevel={(z) => { setZoomLevel(z); handleSettingChange('zoomLevel', z) }}
          />
        )}
        {activeSection === 'preferences' && (
          <PreferencesSection
            localSettings={localSettings}
            saveLocalSettings={saveLocalSettings}
            pdfMarginsRelational={pdfMarginsRelational}
            setPdfMarginsRelational={setPdfMarginsRelational}
          />
        )}
        {activeSection === 'shortcuts' && <ShortcutsSection />}
        {activeSection === 'plugins' && <PluginsSection />}
        {activeSection === 'about' && (
          <AboutSection
            handleExportSettings={handleExportSettings}
            handleImportSettings={handleImportSettings}
            handleResetAll={handleResetAll}
          />
        )}
      </div>
    </div>
  )
}

// ===== General Section =====
const GeneralSection: React.FC<{
  localSettings: any
  saveLocalSettings: (s: any) => void
}> = ({ localSettings, saveLocalSettings }) => (
  <div>
    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>General</h2>

    <SettingGroup title="File Handling">
      <SettingToggle
        label="Show sidebar on startup"
        description="Display the file explorer sidebar when the app starts"
        value={localSettings.showSidebarOnStartup}
        onChange={(v) => saveLocalSettings({ ...localSettings, showSidebarOnStartup: v })}
      />
    </SettingGroup>
  </div>
)

// ===== Appearance Section =====
const AppearanceSection: React.FC<{
  currentTheme: Theme
  setTheme: (t: Theme) => void
  currentFont: string
  setCurrentFont: (f: string) => void
  contentWidth: string
  toggleContentWidth: () => void
  zoomLevel: number
  setZoomLevel: (z: number) => void
}> = ({ currentTheme, setTheme, currentFont, setCurrentFont, contentWidth, toggleContentWidth, zoomLevel, setZoomLevel }) => (
  <div>
    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Appearance</h2>

    <SettingGroup title="Theme">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
        {themeList.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: currentTheme === theme.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '12px',
              transition: 'border-color 0.15s',
            }}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </SettingGroup>

    <SettingGroup title="Font">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {fontCombos.map((font) => (
          <button
            key={font.id}
            onClick={() => setCurrentFont(font.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: currentFont === font.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              fontFamily: font.body,
              transition: 'border-color 0.15s',
            }}
          >
            {font.name}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              {font.category === 'persian' ? 'فارسی' : 'English'}
            </span>
          </button>
        ))}
      </div>
    </SettingGroup>

    <SettingGroup title="Content Width">
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['full', 'medium', 'a4'] as const).map((w) => (
          <button
            key={w}
            onClick={() => {
              if (contentWidth !== w) toggleContentWidth()
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: contentWidth === w ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              textTransform: 'capitalize',
            }}
          >
            {w === 'a4' ? 'A4 (800px)' : w === 'medium' ? 'Medium (1100px)' : 'Full Width'}
          </button>
        ))}
      </div>
    </SettingGroup>

    <SettingGroup title="Zoom">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="range"
          min={50}
          max={300}
          step={5}
          value={zoomLevel}
          onChange={(e) => setZoomLevel(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent-color)' }}
        />
        <span style={{ fontSize: '13px', minWidth: '40px', textAlign: 'center' }}>{zoomLevel}%</span>
        <button
          onClick={() => setZoomLevel(100)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Reset
        </button>
      </div>
    </SettingGroup>
  </div>
)

// A4 base margins — relational scaling preserves this ratio
const A4_MARGINS = { top: 0.79, bottom: 0.79, left: 0.71, right: 0.71 }

// ===== Preferences Section =====
const PreferencesSection: React.FC<{
  localSettings: any
  saveLocalSettings: (s: any) => void
  pdfMarginsRelational: boolean
  setPdfMarginsRelational: (v: boolean) => void
}> = ({ localSettings, saveLocalSettings, pdfMarginsRelational, setPdfMarginsRelational }) => (
  <div>
    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Preferences</h2>

    <SettingGroup title="Fullscreen">
      <SettingToggle
        label="Auto-hide header"
        description="In fullscreen mode, auto-hide the toolbar and show on hover"
        value={localSettings.autoHideHeader}
        onChange={(v) => saveLocalSettings({ ...localSettings, autoHideHeader: v })}
      />
    </SettingGroup>

    <SettingGroup title="Editor">
      <SettingToggle
        label="Smooth scrolling"
        description="Enable smooth scrolling behavior"
        value={localSettings.smoothScrolling}
        onChange={(v) => saveLocalSettings({ ...localSettings, smoothScrolling: v })}
      />
      <SettingToggle
        label="Show line numbers"
        description="Display line numbers in code blocks"
        value={localSettings.showLineNumbers}
        onChange={(v) => saveLocalSettings({ ...localSettings, showLineNumbers: v })}
      />
    </SettingGroup>

    <SettingGroup title="PDF Export Margins (inches)">
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Margins applied when exporting to PDF. Set to 0 for edge-to-edge background.
      </p>
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          color: 'var(--text-primary)',
        }}>
          <input
            type="checkbox"
            checked={pdfMarginsRelational}
            onChange={(e) => setPdfMarginsRelational(e.target.checked)}
            style={{ accentColor: 'var(--accent-color)' }}
          />
          Keep A4 proportions (relational)
        </label>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '24px' }}>
          When checked, all margins scale together to preserve the aspect ratio
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '400px' }}>
        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
          <label key={side} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {side}
            </span>
            <input
              type="number"
              min={0}
              max={3}
              step={0.01}
              value={localSettings.pdfMargins?.[side] ?? 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0
                const margins = { ...localSettings.pdfMargins }

                if (pdfMarginsRelational) {
                  // Scale all margins proportionally based on which side changed
                  const base = A4_MARGINS[side]
                  if (base > 0) {
                    const scale = val / base
                    margins.top = Math.round(A4_MARGINS.top * scale * 100) / 100
                    margins.bottom = Math.round(A4_MARGINS.bottom * scale * 100) / 100
                    margins.left = Math.round(A4_MARGINS.left * scale * 100) / 100
                    margins.right = Math.round(A4_MARGINS.right * scale * 100) / 100
                  }
                } else {
                  margins[side] = val
                }

                saveLocalSettings({ ...localSettings, pdfMargins: margins })
              }}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </label>
        ))}
      </div>
    </SettingGroup>
  </div>
)

// ===== Shortcuts Section =====
const ShortcutsSection: React.FC = () => (
  <div>
    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Keyboard Shortcuts</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {shortcuts.map((s, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
          }}
        >
          <span style={{ fontSize: '13px' }}>{s.action}</span>
          <code style={{
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--code-bg)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-code, monospace)',
            color: 'var(--accent-color)',
          }}>
            {s.keys}
          </code>
        </div>
      ))}
    </div>
  </div>
)

// ===== About Section =====

const PluginsSection: React.FC = () => {
  const enabledPlugins = useAppStore(s => s.enabledPlugins);
  const enablePlugin = useAppStore(s => s.enablePlugin);
  const disablePlugin = useAppStore(s => s.disablePlugin);
  const [plugins, setPlugins] = useState<any[]>([]);

  const [runtimeState, setRuntimeState] = useState<Record<string, {enabled: boolean}>>({});

  const loadPluginsList = async () => {
    const list = await window.electronAPI?.getPlugins?.();
    console.log('[Settings] getPlugins returned:', list?.length, 'plugins');
    setPlugins(list || []);

    // Fetch runtime plugin enabled state
    const state = await window.electronAPI?.getPluginState?.();
    setRuntimeState(state || {});
  };

  const isPluginEnabled = (plugin: any) => {
    if (plugin.runtime) {
      return runtimeState[plugin.name]?.enabled !== false;
    }
    return enabledPlugins.includes(plugin.name);
  };

  useEffect(() => { loadPluginsList(); }, []);

  // Auto-refresh when plugins directory changes
  useEffect(() => {
    const handler = () => {
      console.log('[Settings] Plugins changed, refreshing list...');
      loadPluginsList();
    };
    (window as any).electronAPI?.onPluginsChanged?.(handler);
  }, []);

  const handleInstall = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.setAttribute("webkitdirectory", "");
    input.onchange = async (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      const dirPath = (files[0] as any).path;
      if (dirPath) {
        const result = await (window as any).electronAPI?.installPlugin?.(dirPath);
        if (result?.success) loadPluginsList();
      }
    };
    input.click();
  };

  const handleUninstall = async (name: string) => {
    const result = await (window as any).electronAPI?.uninstallPlugin?.(name);
    if (result?.success) loadPluginsList();
  };

  const getContributorSummary = (contributes: any) => {
    if (!contributes) return null;
    const parts: string[] = [];
    if (contributes.fileTypes) {
      const exts = contributes.fileTypes.flatMap((ft: any) => ft.extensions);
      parts.push("File types: " + exts.join(", "));
    }
    if (contributes.slots) {
      parts.push("UI slots: " + contributes.slots.map((s: any) => s.slot).join(", "));
    }
    return parts.length > 0 ? parts.join(" | ") : null;
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Plugins</h2>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
        Manage installed plugins. Disable a plugin and reload the app to apply changes.
      </p>

      {plugins.length === 0 ? (
        <div style={{
          padding: "20px", textAlign: "center", color: "var(--text-muted)",
          backgroundColor: "var(--bg-secondary)", borderRadius: "8px",
          border: "1px solid var(--border-color)",
        }}>No plugins installed</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {plugins.map((plugin: any) => {
            const isEnabled = isPluginEnabled(plugin);
            const summary = getContributorSummary(plugin.contributes);
            return (
              <div key={plugin.name} style={{
                padding: "12px 16px", borderRadius: "8px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{plugin.displayName || plugin.name}</span>
                      <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>v{plugin.version}</span>
                    </div>
                    {plugin.description && <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>{plugin.description}</p>}
                    {summary && <p style={{ fontSize: "11px", color: "var(--accent-color)", marginTop: "4px", marginBottom: 0 }}>{summary}</p>}
                  </div>
                  <div
                    onClick={async () => {
                      if (plugin.runtime) {
                        // Runtime plugin: toggle via main process, then refresh
                        const result = await (window as any).electronAPI?.setPluginState?.(plugin.name, !isEnabled);
                        console.log('[Settings] toggle result:', result);
                        // Small delay to let main process finish loading/unloading
                        setTimeout(() => loadPluginsList(), 200);
                      } else {
                        // Built-in plugin: toggle via Zustand
                        if (isEnabled) disablePlugin(plugin.name);
                        else enablePlugin(plugin.name);
                      }
                    }}
                    style={{ width: "36px", height: "20px", borderRadius: "10px", backgroundColor: isEnabled ? "var(--accent-color)" : "var(--bg-tertiary)", position: "relative", cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0 }}
                  >
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "2px", left: isEnabled ? "18px" : "2px", transition: "left 0.2s" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <button onClick={handleInstall} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", cursor: "pointer", fontSize: "13px" }}>Install Plugin</button>
        <button onClick={() => (window as any).electronAPI?.openPluginsFolder?.()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", cursor: "pointer", fontSize: "13px" }}>Open Plugins Folder</button>
        {plugins.length > 0 && <button onClick={() => (window as any).electronAPI?.reloadMain?.()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", cursor: "pointer", fontSize: "13px" }}>Reload App</button>}
      </div>
    </div>
  );
};

const AboutSection: React.FC<{
  handleExportSettings: () => void
  handleImportSettings: () => void
  handleResetAll: () => void
}> = ({ handleExportSettings, handleImportSettings, handleResetAll }) => (
  <div>
    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>About</h2>

    <div style={{
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      marginBottom: '24px',
    }}>
      <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Markdown Viewer</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Version 1.1.0</p>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        A lightweight Markdown file viewer with themes, fonts, zoom, and local file support.
      </p>
    </div>

    <SettingGroup title="Data Management">
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={handleExportSettings} style={buttonStyle}>
          <Download size={14} />
          Export Settings
        </button>
        <button onClick={handleImportSettings} style={buttonStyle}>
          <Upload size={14} />
          Import Settings
        </button>
        <button onClick={handleResetAll} style={{ ...buttonStyle, color: '#f85149', borderColor: '#f85149' }}>
          <RotateCcw size={14} />
          Reset All Settings
        </button>
      </div>
    </SettingGroup>
  </div>
)

// ===== Shared Components =====
const SettingGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
      {title}
    </h3>
    {children}
  </div>
)

const SettingToggle: React.FC<{
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}> = ({ label, description, value, onChange }) => (
  <label style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
  >
    <div>
      <div style={{ fontSize: '13px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
    </div>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        backgroundColor: value ? 'var(--accent-color)' : 'var(--bg-tertiary)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute',
        top: '2px',
        left: value ? '18px' : '2px',
        transition: 'left 0.2s',
      }} />
    </div>
  </label>
)

const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '13px',
}