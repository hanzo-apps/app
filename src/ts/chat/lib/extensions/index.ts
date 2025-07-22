// Direct imports of built extensions to avoid dynamic loading issues
import ModelExtension from '@/../../extensions/model-extension/dist/index.js'
import DownloadExtension from '@/../../extensions/download-extension/dist/index.js'
import AssistantExtension from '@/../../extensions/assistant-extension/dist/index.js'
import ConversationalExtension from '@/../../extensions/conversational-extension/dist/index.js'
import InferenceCortexExtension from '@/../../extensions/inference-cortex-extension/dist/index.js'
import EngineManagementExtension from '@/../../extensions/engine-management-extension/dist/index.js'
import HardwareManagementExtension from '@/../../extensions/hardware-management-extension/dist/index.js'

export const BUILT_IN_EXTENSIONS = {
  '@zenhq/model-extension': ModelExtension,
  '@zenhq/download-extension': DownloadExtension,
  '@zenhq/assistant-extension': AssistantExtension,
  '@zenhq/conversational-extension': ConversationalExtension,
  '@zenhq/inference-cortex-extension': InferenceCortexExtension,
  '@zenhq/engine-management-extension': EngineManagementExtension,
  '@zenhq/hardware-management-extension': HardwareManagementExtension,
}

export function getBuiltInExtension(name: string) {
  return BUILT_IN_EXTENSIONS[name as keyof typeof BUILT_IN_EXTENSIONS]
}