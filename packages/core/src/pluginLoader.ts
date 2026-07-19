import { PluginManager } from '@mdview/plugin-api';
import PdfPlugin from '@mdview/plugin-pdf';

// Create global plugin manager
export const pluginManager = new PluginManager();

// Load built-in plugins
pluginManager.register(PdfPlugin);
