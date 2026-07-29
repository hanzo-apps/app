'use client';

import { SizableText, Paragraph } from '@hanzo/gui';
import { GuidedTourStepContent } from './types';

export const GUIDED_TOUR_STEPS: GuidedTourStepContent[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hanzo App',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>Let's take a guided tour of the workspace so you can see how projects, agents, and saves all fit together.</p>
        <p>The tour takes under two minutes and you can skip at any time.</p>
      </SizableText>
    ),
    location: 'project-manager',
    primaryLabel: 'Start tour',
    secondaryLabel: 'Skip',
  },
  {
    id: 'projects-overview',
    title: 'Projects at a Glance',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>This is your project gallery. Recent work appears here with quick actions for opening, duplicating, or exporting.</p>
        <p>I've loaded a demo project so you can explore without setting anything up.</p>
      </SizableText>
    ),
    location: 'project-manager',
    target: '[data-tour-id="projects-list"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'create-project',
    title: 'Creating a Project',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>Use the New Project button to start fresh. The dialog lets you name the project and add an optional description.</p>
      </SizableText>
    ),
    location: 'project-manager',
    target: '[data-tour-id="new-project-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'project-controls',
    title: 'Exporting a Project',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>Click the dropdown menu on any project card to access export options. You can export as a ZIP for deployment or JSON for backup.</p>
        <p>Projects can also be duplicated or deleted from this menu.</p>
      </SizableText>
    ),
    location: 'project-manager',
    target: '[data-tour-id="project-export-json"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'edit-project',
    title: 'Editing a Project',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>To get to the workspace and start editing, simply click on the project card. This will open the full development environment.</p>
        <p>Click Next to enter the workspace and continue the tour.</p>
      </SizableText>
    ),
    location: 'project-manager',
    target: '[data-tour-id="project-card"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-overview',
    title: 'Workspace Layout',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>The workspace has four main areas: the assistant conversation, the virtual file explorer, your editor tabs, and the live preview.</p>
        <p>The VFS works like a project file tree—add HTML, CSS, JS, or assets and the agent can edit them just like local files.</p>
      </SizableText>
    ),
    location: 'workspace',
    target: '[data-tour-id="workspace-panels"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-edit',
    title: 'See the Agent in Action',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>I'll request the agent to change the color of "Our Services" button to a green accent and the agent performs the task.</p>
        <p>This mimics what you will see when asking the agent to perform tasks.</p>
      </SizableText>
    ),
    location: 'workspace',
    target: '[data-tour-id="assistant-panel"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-focus',
    title: 'Element Focus Tool',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>The crosshair tool in the preview panel lets you select and focus on specific elements in your design.</p>
        <p>Click it to activate element selection mode, then click any element in the preview to highlight it.</p>
      </SizableText>
    ),
    location: 'workspace',
    target: '[data-tour-id="focus-crosshair-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-checkpoint',
    title: 'Checkpoints & Manual Saves',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>The "Discard Changes" button restores to the original saved point, letting you revert any changes back to your last manual save.</p>
        <p>If you like the result, use the Save button to lock it in as your manual checkpoint.</p>
      </SizableText>
    ),
    location: 'workspace',
    target: '[data-tour-id="discard-changes-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'clear-conversation',
    title: 'Clear Conversation',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>The agent will have the last tasks and responses in memory. You can clear it with the trashcan button to start fresh.</p>
        <p>This removes the conversation history but keeps your project files intact.</p>
      </SizableText>
    ),
    location: 'workspace',
    target: '[data-tour-id="clear-chat-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'provider-settings',
    title: 'Connect Your Provider',
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>Set your API key under Settings → Provider. I recommend trying OpenRouter with the <code>gpt-oss-120b</code> model, but you can use any supported provider.</p>
        <p>You can return here anytime from the header menu.</p>
        <Paragraph fontSize="$1" color="$orange9">
          Privacy note: Remote LLM providers (OpenAI, Anthropic, etc.) will receive your code when generating. For complete privacy, use local models with Ollama or LM Studio.
        </Paragraph>
      </SizableText>
    ),
    location: 'workspace',
    target: '[data-tour-id="provider-settings-trigger"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'wrap-up',
    title: "You're Ready!",
    body: (
      <SizableText rowGap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="column">
        <p>That's the basics—prompt the agent, preview updates, and save when you're happy. You can replay this tour from the Help menu anytime.</p>
        <p>Have fun building! Let me know what you ship.</p>
      </SizableText>
    ),
    location: 'workspace',
    showBack: true,
    primaryLabel: 'Finish',
    secondaryLabel: 'Skip',
  },
];
