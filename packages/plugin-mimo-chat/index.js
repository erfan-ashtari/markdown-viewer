/**
 * Mimo Chat Plugin - AI chatbot for MDView
 * 
 * Features:
 * - Summarize active file with one click
 * - Ask questions about the file
 * - Shows thinking process in collapsible section
 * - Loading animation while waiting
 * - Notification when answer is ready
 * - Cancel button to abort long-running queries
 */

const { execFile } = require('child_process');
const path = require('path');

// Constants
const MAX_QUERY_LENGTH = 4096;
const MAX_HISTORY = 50;
const TIMEOUT_MS = 120000; // 2 minutes

/** @type {import('@mdview/plugin-api/runtime').RuntimePluginContext} */
module.exports = {
  _state: null,

  activate(context) {
    console.log('[mimo-chat] Activated');

    // Find mimo CLI path
    let mimoPath = null;
    let mimoInstalled = false;
    try {
      const { execSync } = require('child_process');
      // Try to find mimo path
      const whichCmd = process.platform === 'win32' ? 'where' : 'which';
      mimoPath = execSync(`${whichCmd} mimo`, { encoding: 'utf-8', timeout: 3000 }).trim().split('\n')[0];
      
      // On Windows, ensure .cmd extension
      if (process.platform === 'win32' && !mimoPath.endsWith('.cmd')) {
        mimoPath = mimoPath + '.cmd';
      }
      
      console.log('[mimo-chat] mimo path:', mimoPath);
      
      // Verify it works
      execSync(`"${mimoPath}" --version`, { encoding: 'utf-8', stdio: 'ignore', timeout: 3000 });
      mimoInstalled = true;
      console.log('[mimo-chat] mimo CLI found and verified');
    } catch (err) {
      console.warn('[mimo-chat] mimo CLI error:', err.message);
      // Try fallback: check common install locations
      const fallbackPaths = [
        path.join(process.env.APPDATA || '', 'npm', 'mimo.cmd'),
        path.join(process.env.APPDATA || '', 'npm', 'mimo'),
        '/usr/local/bin/mimo',
        '/usr/bin/mimo',
      ];
      for (const p of fallbackPaths) {
        try {
          require('fs').accessSync(p);
          mimoPath = p;
          mimoInstalled = true;
          console.log('[mimo-chat] mimo found at fallback:', mimoPath);
          break;
        } catch {}
      }
      if (!mimoInstalled) {
        console.warn('[mimo-chat] mimo not found in PATH or fallback locations');
      }
    }

    const state = {
      isProcessing: false,
      chatHistory: [],
      mimoInstalled,
      mimoPath,
      currentProcess: null,
    };
    this._state = state;

    // Helper: validate input
    function validateInput(query) {
      if (!query || typeof query !== 'string') return { valid: false, error: 'Invalid input' };
      const trimmed = query.trim();
      if (trimmed.length === 0) return { valid: false, error: 'Please enter a question' };
      if (trimmed.length > MAX_QUERY_LENGTH) {
        return { valid: false, error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` };
      }
      return { valid: true, query: trimmed };
    }

    // Helper: execute mimo CLI (async, non-blocking)
    function executeMimo(prompt, filePath) {
      return new Promise((resolve, reject) => {
        const mimoExe = state.mimoPath || 'mimo';
        const args = [
          'run',
          `"${prompt}"`,
          '--thinking',
          '--model', 'mimo/mimo-auto',
          '--agent', 'build',
          '--dir', `"${path.dirname(filePath)}"`,
          '--dangerously-skip-permissions',
          '--file', `"${filePath}"`,
        ];

        // Log debug info
        console.log('[mimo-chat] Executing:', mimoExe);
        console.log('[mimo-chat] Args:', args.join(' '));
        console.log('[mimo-chat] CWD:', path.dirname(filePath));

        const child = execFile(mimoExe, args, {
          encoding: 'utf-8',
          timeout: TIMEOUT_MS,
          maxBuffer: 10 * 1024 * 1024,
          cwd: path.dirname(filePath),
        }, (error, stdout, stderr) => {
          state.currentProcess = null;
          if (error) {
            console.error('[mimo-chat] CLI error:', error.message);
            console.error('[mimo-chat] stderr:', stderr);
            reject(error);
          } else {
            console.log('[mimo-chat] Response length:', stdout.length);
            resolve(stdout);
          }
        });

        state.currentProcess = child;
      });
    }

    // Helper: parse mimo output into thinking and answer
    function parseOutput(output) {
      const thinkingMatch = output.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
      let answer = output.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
      answer = answer.replace(/\n{3,}/g, '\n\n');
      return { thinking, answer };
    }

    // Helper: truncate text for display
    function truncate(text, maxLength = 500) {
      if (!text) return '';
      return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    }

    // Helper: get user-friendly error message
    function getErrorMessage(err) {
      const msg = err.message || String(err);
      if (msg.includes('ENOENT') || msg.includes('not found')) {
        return 'Mimo CLI not found. Please install: npm install -g @mimo-ai/cli';
      }
      if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
        return 'Request timed out. Try a shorter question.';
      }
      if (msg.includes('maxBuffer') || msg.includes('MAXBUFFER')) {
        return 'Response too large. Try a shorter question.';
      }
      return 'An error occurred. Please try again.';
    }

    // Register sidebar panel
    context.registerSidebarPanel({
      id: 'mimo-chat',
      title: 'Mimo Chat',
      icon: 'MessageSquare',
      children: mimoInstalled ? [
        // Chat Input
        { type: 'text-input', id: 'chat-input', placeholder: 'Ask about this file...', value: '' },
        
        // Action Buttons
        { type: 'button', id: 'send-btn', label: 'Send', icon: 'Send', variant: 'primary' },
        { type: 'button', id: 'summarize-btn', label: 'Summarize', icon: 'FileText', variant: 'ghost' },
        { type: 'button', id: 'cancel-btn', label: 'Cancel', icon: 'XCircle', variant: 'danger', disabled: true },
        
        // Loading State
        { type: 'separator', id: 'sep1' },
        { type: 'status', id: 'status', label: 'Status', value: 'Ready', color: 'default' },
        { type: 'progress', id: 'progress', label: 'Progress', value: 0, showPercent: false },
        
        // Thinking Section (collapsible)
        { type: 'separator', id: 'sep2' },
        { type: 'section', id: 'thinking-section', title: 'Thinking Process', defaultCollapsed: true, children: [
          { type: 'status', id: 'thinking-content', value: 'No thinking yet', color: 'default' },
        ]},
        
        // Answer Section
        { type: 'separator', id: 'sep3' },
        { type: 'section', id: 'answer-section', title: 'Answer', children: [
          { type: 'status', id: 'answer-content', value: 'Ask a question or click Summarize', color: 'default' },
        ]},
        
        // Chat History
        { type: 'separator', id: 'sep4' },
        { type: 'section', id: 'history-section', title: 'Chat History', defaultCollapsed: true, children: [
          { type: 'status', id: 'history-content', value: 'No history yet', color: 'default' },
        ]},
      ] : [
        // Not installed message
        { type: 'status', id: 'error-status', label: 'Error', value: 'Mimo CLI not installed', color: 'error' },
        { type: 'separator', id: 'sep1' },
        { type: 'label', id: 'install-title', text: 'Installation Instructions', variant: 'heading' },
        { type: 'label', id: 'install-step1', text: '1. Install Mimo CLI globally:', variant: 'text' },
        { type: 'status', id: 'install-cmd', value: 'npm install -g @mimo-ai/cli', color: 'info' },
        { type: 'label', id: 'install-step2', text: '2. Restart MDView', variant: 'text' },
        { type: 'separator', id: 'sep2' },
        { type: 'label', id: 'install-note', text: 'Mimo CLI is required for AI features', variant: 'muted' },
      ],
    });

    // Handle UI events
    context.onEvent('ui-event', async ({ elementId, eventType, payload }) => {
      // Handle Send button
      if (elementId === 'send-btn') {
        const inputValue = payload?.value || '';
        const validation = validateInput(inputValue);
        if (!validation.valid) {
          context.updateElementState({
            'status': { value: validation.error, color: 'warning' },
          });
          return;
        }
        await processQuery(validation.query);
      }

      // Handle Summarize button
      if (elementId === 'summarize-btn') {
        await processQuery('Summarize this file for me. Provide a concise overview of the main points, key topics, and important details.');
      }

      // Handle chat input submission (Enter key)
      if (elementId === 'chat-input' && eventType === 'submit') {
        const inputValue = payload?.value || '';
        const validation = validateInput(inputValue);
        if (!validation.valid) return;
        await processQuery(validation.query);
      }

      // Handle Cancel button
      if (elementId === 'cancel-btn' && state.currentProcess) {
        state.currentProcess.kill();
        state.currentProcess = null;
        state.isProcessing = false;
        context.updateElementState({
          'status': { value: 'Cancelled', color: 'warning' },
          'progress': { value: 0 },
          'send-btn': { disabled: false },
          'summarize-btn': { disabled: false },
          'cancel-btn': { disabled: true },
        });
      }
    });

    // Process a query
    async function processQuery(query) {
      if (state.isProcessing) {
        context.updateElementState({
          'status': { value: 'Already processing...', color: 'warning' },
        });
        return;
      }

      const file = context.currentFile;
      if (!file) {
        context.updateElementState({
          'status': { value: 'No file open', color: 'error' },
        });
        return;
      }

      state.isProcessing = true;

      try {
        // Update UI - processing started, disable buttons
        context.updateElementState({
          'status': { value: 'Processing...', color: 'info' },
          'progress': { value: 50 },
          'thinking-content': { value: 'Starting analysis...' },
          'answer-content': { value: 'Waiting for response...' },
          'send-btn': { disabled: true },
          'summarize-btn': { disabled: true },
          'cancel-btn': { disabled: false },
        });

        // Execute mimo (async, non-blocking)
        const output = await executeMimo(query, file.filePath);

        // Parse output
        const { thinking, answer } = parseOutput(output);

        // Update UI with results
        context.updateElementState({
          'status': { value: 'Complete', color: 'success' },
          'progress': { value: 100 },
          'thinking-content': { value: thinking || 'No thinking process captured' },
          'answer-content': { value: answer || 'No answer generated' },
        });

        // Add to chat history (capped)
        state.chatHistory.push({
          query,
          answer: truncate(answer, 200),
          timestamp: new Date().toLocaleTimeString(),
        });
        if (state.chatHistory.length > MAX_HISTORY) {
          state.chatHistory = state.chatHistory.slice(-MAX_HISTORY);
        }

        // Update history display
        const historyText = state.chatHistory
          .map(h => `[${h.timestamp}] Q: ${truncate(h.query, 50)}\nA: ${h.answer}`)
          .join('\n\n');
        context.updateElementState({
          'history-content': { value: historyText || 'No history yet' },
        });

        // Send notification
        context.notify({
          title: 'Mimo Chat',
          body: truncate(answer, 100),
        });

        console.log('[mimo-chat] Response received');

      } catch (err) {
        console.error('[mimo-chat] Error:', err.message);
        context.updateElementState({
          'status': { value: getErrorMessage(err), color: 'error' },
          'progress': { value: 0 },
          'answer-content': { value: getErrorMessage(err) },
          'send-btn': { disabled: false },
          'summarize-btn': { disabled: false },
          'cancel-btn': { disabled: true },
        });
      } finally {
        state.isProcessing = false;
        // Re-enable buttons if not already done
        context.updateElementState({
          'send-btn': { disabled: false },
          'summarize-btn': { disabled: false },
          'cancel-btn': { disabled: true },
        });
      }
    }

    console.log('[mimo-chat] Registered sidebar panel');
  },

  deactivate() {
    // Kill any running process
    if (this._state?.currentProcess) {
      this._state.currentProcess.kill();
    }
    this._state = null;
    console.log('[mimo-chat] Deactivated');
  }
};
