'use client';

import { YStack, Paragraph } from '@hanzo/ui';
import { GuidedTourStepContent } from './types';

export const GUIDED_TOUR_STEPS: GuidedTourStepContent[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hanzo App',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Let's take a guided tour of the workspace so you can see how projects, agents, and saves all fit together.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">The tour takes under two minutes and you can skip at any time.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    primaryLabel: 'Start tour',
    secondaryLabel: 'Skip',
  },
  {
    id: 'projects-overview',
    title: 'Projects at a Glance',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">This is your project gallery. Recent work appears here with quick actions for opening, duplicating, or exporting.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">I've loaded a demo project so you can explore without setting anything up.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="projects-list"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'create-project',
    title: 'Creating a Project',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Use the New Project button to start fresh. The dialog lets you name the project and add an optional description.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="new-project-button"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'project-controls',
    title: 'Exporting a Project',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Click the dropdown menu on any project card to access export options. You can export as a ZIP for deployment or JSON for backup.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Projects can also be duplicated or deleted from this menu.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="project-export-json"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'edit-project',
    title: 'Editing a Project',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">To get to the workspace and start editing, simply click on the project card. This will open the full development environment.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Click Next to enter the workspace and continue the tour.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="project-card"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-overview',
    title: 'Workspace Layout',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The workspace has four main areas: the assistant conversation, the virtual file explorer, your editor tabs, and the live preview.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">The VFS works like a project file tree—add HTML, CSS, JS, or assets and the agent can edit them just like local files.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="workspace-panels"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-edit',
    title: 'See the Agent in Action',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">I'll request the agent to change the color of "Our Services" button to a green accent and the agent performs the task.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">This mimics what you will see when asking the agent to perform tasks.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="assistant-panel"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-focus',
    title: 'Element Focus Tool',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The crosshair tool in the preview panel lets you select and focus on specific elements in your design.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Click it to activate element selection mode, then click any element in the preview to highlight it.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="focus-crosshair-button"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-checkpoint',
    title: 'Checkpoints & Manual Saves',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The "Discard Changes" button restores to the original saved point, letting you revert any changes back to your last manual save.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">If you like the result, use the Save button to lock it in as your manual checkpoint.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="discard-changes-button"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'clear-conversation',
    title: 'Clear Conversation',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The agent will have the last tasks and responses in memory. You can clear it with the trashcan button to start fresh.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">This removes the conversation history but keeps your project files intact.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="clear-chat-button"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'provider-settings',
    title: 'Connect Your Provider',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Set your API key under Settings → Provider. I recommend trying OpenRouter with the <code>gpt-oss-120b</code> model, but you can use any supported provider.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">You can return here anytime from the header menu.</Paragraph>
        <Paragraph fontSize="$1" color="$orange9">
          Privacy note: Remote LLM providers (OpenAI, Anthropic, etc.) will receive your code when generating. For complete privacy, use local models with Ollama or LM Studio.
        </Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="provider-settings-trigger"]',
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'wrap-up',
    title: "You're Ready!",
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">That's the basics—prompt the agent, preview updates, and save when you're happy. You can replay this tour from the Help menu anytime.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Have fun building! Let me know what you ship.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    primaryLabel: 'Finish',
    secondaryLabel: 'Skip',
  },
];
