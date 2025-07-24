// Bundled extensions to avoid dynamic loading issues in Tauri
// These are pre-built extensions that are included in the app bundle

// Import the actual extension classes
import ModelExtension from '@zenhq/model-extension'
import DownloadExtension from '@zenhq/download-extension' 
import AssistantExtension from '@zenhq/assistant-extension'
import ConversationalExtension from '@zenhq/conversational-extension'
import InferenceCortexExtension from '@zenhq/inference-cortex-extension'
import EngineManagementExtension from '@zenhq/engine-management-extension'
import HardwareManagementExtension from '@zenhq/hardware-management-extension'

// Export them as a map
export const BUNDLED_EXTENSIONS = {
  '@zenhq/model-extension': ModelExtension,
  '@zenhq/download-extension': DownloadExtension,
  '@zenhq/assistant-extension': AssistantExtension,
  '@zenhq/conversational-extension': ConversationalExtension,
  '@zenhq/inference-cortex-extension': InferenceCortexExtension,
  '@zenhq/engine-management-extension': EngineManagementExtension,
  '@zenhq/hardware-management-extension': HardwareManagementExtension,
} as const

export function getBundledExtension(name: string) {
  return BUNDLED_EXTENSIONS[name as keyof typeof BUNDLED_EXTENSIONS]
}

// Helper to check if extension is bundled
export function isBundledExtension(name: string): boolean {
  return name in BUNDLED_EXTENSIONS
}