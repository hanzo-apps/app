'use client';

import { YStack, Paragraph } from '@hanzo/ui';
import { GuidedTourStepContent } from './types';

export const GUIDED_TOUR_STEPS: GuidedTourStepContent[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hanzo App',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">This tour walks through the workspace: where projects live, how the agent works, and what saving does.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">The tour takes under two minutes and you can skip at any time.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    primaryLabel: 'Start tour',
    secondaryLabel: 'Skip',
  },
  {
    id: 'projects-overview',
    title: 'Your projects',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">This is where your projects live. Recent work shows up here, with actions to open, duplicate or export it.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">A demo project is already loaded, so there is nothing to set up first.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="projects-list"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'create-project',
    title: 'Making a project',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">New Project starts an empty one. Give it a name, and a description if you want one.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="new-project-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'project-controls',
    title: 'Exporting a project',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The menu on any project card exports it: ZIP to deploy somewhere else, JSON to keep a backup.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Projects can also be duplicated or deleted from this menu.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="project-export-json"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'edit-project',
    title: 'Opening a project',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Click a project card to open the workspace, where the editor, the preview and the agent all sit together.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Click Next to enter the workspace and continue the tour.</Paragraph>
      </YStack>
    ),
    location: 'project-manager',
    target: '[data-tour-id="project-card"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-overview',
    title: 'The workspace',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The workspace holds the agent conversation, the file explorer, your editor tabs, and the live preview.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">The file explorer works like a project tree. Add HTML, CSS, JS or assets and the agent edits them the same way it edits anything else.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="workspace-panels"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-edit',
    title: 'Watch the agent work',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The tour asks the agent to change the "Our Services" button to a green accent, and the agent does it.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">This is what any request to the agent looks like.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="assistant-panel"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-focus',
    title: 'Pointing at an element',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The crosshair in the preview panel picks out one element, so a request can name the thing you mean instead of describing it.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Click the crosshair, then click any element in the preview to select it.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="focus-crosshair-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'workspace-checkpoint',
    title: 'Checkpoints and saves',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Discard Changes puts the project back to your last save, whatever the agent has done since.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">If you like where it got to, Save makes that the point it goes back to next time.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="discard-changes-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'clear-conversation',
    title: 'Clearing the conversation',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">The agent keeps the recent tasks and replies in memory. The trash button clears them.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">That removes the conversation only. Your project files are untouched.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="clear-chat-button"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'provider-settings',
    title: 'Connect a provider',
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">Set your API key under Settings → Provider. OpenRouter with the <code>gpt-oss-120b</code> model is a reasonable starting point, and any supported provider works.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">The header menu brings you back here whenever you want to change it.</Paragraph>
        <Paragraph fontSize="$1" color="$orange9">
          A remote provider — OpenAI, Anthropic and the rest — receives your code when it generates. Run a local model with Ollama or LM Studio to keep the code on your own machine.
        </Paragraph>
      </YStack>
    ),
    location: 'workspace',
    target: '[data-tour-id="provider-settings-trigger"]',
    showBack: true,
    primaryLabel: 'Next',
    secondaryLabel: 'Skip',
  },
  {
    id: 'wrap-up',
    title: "That's the tour",
    body: (
      <YStack rowGap="$2">
        <Paragraph fontSize="$3" color="$color11">That's all of it: ask the agent, watch the preview, save when it looks right. The Help menu replays this tour whenever you want it.</Paragraph>
        <Paragraph fontSize="$3" color="$color11">Close this and start with a sentence.</Paragraph>
      </YStack>
    ),
    location: 'workspace',
    showBack: true,
    primaryLabel: 'Finish',
    secondaryLabel: 'Skip',
  },
];
