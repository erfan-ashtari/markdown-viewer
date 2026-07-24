import React, { useState, useCallback, memo } from 'react'
import {
  Activity, AlertCircle, ArrowRight, Beaker, Braces,
  Check, CheckCircle, ChevronDown, ChevronRight, Clock, Code, Copy,
  Database, Download, Edit, Eye, File, FileText, Filter, Folder,
  FolderOpen, Globe, Hash, Heart, Home, Info, Key, Link, List, Lock,
  Mail, Map, MessageSquare, Minus, Moon, MoreHorizontal, Package,
  Pause, Play, Plus, Power, RefreshCw, Save, Search, Send, Server,
  Settings, Share, Shield, Slash, Star, Sun, Terminal, Trash2,
  TrendingUp, Type, Unlock, Upload, User, Users, Wrench, X, Zap,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
  Activity, AlertCircle, ArrowRight, Beaker, Braces,
  Check, CheckCircle, ChevronDown, ChevronRight, Clock, Code, Copy,
  Database, Download, Edit, Eye, File, FileText, Filter, Folder,
  FolderOpen, Globe, Hash, Heart, Home, Info, Key, Link, List, Lock,
  Mail, Map, MessageSquare, Minus, Moon, MoreHorizontal, Package,
  Pause, Play, Plus, Power, RefreshCw, Save, Search, Send, Server,
  Settings, Share, Shield, Slash, Star, Sun, Terminal, Trash2,
  TrendingUp, Type, Unlock, Upload, User, Users, Wrench, X, Zap,
}

export const ButtonElement = memo(({ element, onInteraction }: any) => {
  const [loading, setLoading] = useState(false)
  const IconComponent = element.icon ? iconMap[element.icon] : null

  const handleClick = useCallback(async () => {
    setLoading(true)
    try {
      await onInteraction(element.id, 'click', {})
    } finally {
      setLoading(false)
    }
  }, [element.id, onInteraction])

  const variantStyles: Record<string, React.CSSProperties> = {
    default: { background: 'transparent', color: 'var(--text-primary)' },
    primary: { background: 'var(--accent-color)', color: '#fff' },
    danger: { background: '#ef4444', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-muted)' },
  }

  return (
    <button
      onClick={handleClick}
      disabled={element.disabled || loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        padding: '6px 10px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: element.disabled || loading ? 'not-allowed' : 'pointer',
        opacity: element.disabled ? 0.5 : 1,
        transition: 'background-color 0.15s',
        ...variantStyles[element.variant || 'default'],
      }}
      onMouseEnter={(e) => {
        if (!element.disabled && !loading) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = variantStyles[element.variant || 'default'].background as string
      }}
    >
      {loading ? (
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
      ) : IconComponent ? (
        <IconComponent size={14} />
      ) : null}
      <span>{element.label}</span>
    </button>
  )
})
ButtonElement.displayName = 'ButtonElement'
