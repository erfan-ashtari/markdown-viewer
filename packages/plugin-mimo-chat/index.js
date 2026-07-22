/**
 * Mimo Chat Plugin - AI chatbot for MDView
 * 
 * Features:
 * - Summarize active file with one click
 * - Ask questions about the file
 * - Shows thinking process in collapsible section
 * - Loading animation while waiting
 * - Notification when answer is ready
 */

const { execSync } = require('child_process');
const path = require('path');

/** @type {import('@mdview/plugin-api/runtime').RuntimePluginContext} */
module.exports = {
  _state: null,

  activate(context) {
    console.log('[mimo-chat] Activated');

    // Check if mimo CLI is installed
    let mimoInstalled = false;
    try {
      execSync('mimo --version', { encoding: 'utf-8', stdio: 'ignore' });
      mimoInstalled = true;
      console.log('[mimo-chat] mimo CLI found');
    } catch (err) {
      console.warn('[mimo-chat] mimo CLI not found');
    }

    const state = {
      isProcessing: false,
      chatHistory: [],
      mimoInstalled,
    };
    this._state = state;

    // Helper: execute mimo CLI and parse output
    function executeMimo(prompt, filePath) {
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const escapedPath = filePath.replace(/'/g, "'\\''");
      
      const cmd = `mimo run '${escapedPrompt}' --thinking --model mimo/mimo-auto --agent build --dir "${path.dirname(filePath)}" --dangerously-skip-permissions --file "${escapedPath}"`;
      
      console.log('[mimo-chat] Executing:', cmd);
      
      const result = execSync(cmd, { 
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      
      return result;
    }

    // Helper: parse mimo output into thinking and answer
    function parseOutput(output) {
      // Try to extract thinking section
      const thinkingMatch = output.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
      
      // Answer is everything outside thinking tags
      let answer = output.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
      
      // Clean up common artifacts
      answer = answer.replace(/^```[\s\S]*?```/gm, (match) => match); // Keep code blocks
      answer = answer.replace(/\n{3,}/g, '\n\n'); // Reduce multiple newlines
      
      return { thinking, answer };
    }

    // Helper: truncate text for display
    function truncate(text, maxLength = 500) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
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
        { type: 'button', id: 'summarize-btn', label: 'Summarize', icon: 'FileText', variant: 'default' },
        
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
        if (!inputValue.trim()) {
          context.updateElementState({
            'status': { value: 'Please enter a question', color: 'warning' },
          });
          return;
        }
        await processQuery(inputValue);
      }

      // Handle Summarize button
      if (elementId === 'summarize-btn') {
        await processQuery('Summarize this file for me. Provide a concise overview of the main points, key topics, and important details.');
      }

      // Handle chat input submission (Enter key)
      if (elementId === 'chat-input' && eventType === 'submit') {
        const inputValue = payload?.value || '';
        if (!inputValue.trim()) return;
        await processQuery(inputValue);
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
        // Update UI - processing started
        context.updateElementState({
          'status': { value: 'Processing...', color: 'info' },
          'progress': { value: 10 },
          'thinking-content': { value: 'Starting analysis...' },
          'answer-content': { value: 'Waiting for response...' },
        });

        // Progress simulation
        let progress = 10;
        const progressInterval = setInterval(() => {
          if (progress < 90) {
            progress += 5;
            context.updateElementState({ 'progress': { value: progress } });
          }
        }, 500);

        // Execute mimo
        context.updateElementState({
          'status': { value: 'Querying Mimo AI...', color: 'info' },
          'progress': { value: 30 },
        });

        const output = executeMimo(query, file.filePath);

        // Parse output
        const { thinking, answer } = parseOutput(output);

        // Complete progress
        clearInterval(progressInterval);
        context.updateElementState({ 'progress': { value: 100 } });

        // Update UI with results
        context.updateElementState({
          'status': { value: 'Complete', color: 'success' },
          'thinking-content': { value: thinking || 'No thinking process captured' },
          'answer-content': { value: answer || 'No answer generated' },
        });

        // Add to chat history
        state.chatHistory.push({
          query,
          answer: truncate(answer, 200),
          timestamp: new Date().toLocaleTimeString(),
        });

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
          'status': { value: 'Error: ' + truncate(err.message, 100), color: 'error' },
          'progress': { value: 0 },
          'answer-content': { value: 'Error: ' + err.message },
        });
      } finally {
        state.isProcessing = false;
      }
    }

    console.log('[mimo-chat] Registered sidebar panel');
  },

  deactivate() {
    this._state = null;
    console.log('[mimo-chat] Deactivated');
  }
};
