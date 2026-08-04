'use client';

import { YStack, XStack, H1, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Skill } from '@/lib/vfs/skills/types';
import { skillsService } from '@/lib/vfs/skills';
import { createSkillTemplate, parseSkillFile, generateSkillFile } from '@/lib/vfs/skills/parser';
import { Button, Input, Textarea, Label, toast } from '@hanzo/ui';
import { ArrowLeft, Save, FileText } from 'lucide-react';

interface SkillEditorProps {
  skill: Skill | null;
  mode: 'create' | 'edit';
  onSave: () => void;
  onCancel: () => void;
}

export function SkillEditor({ skill, mode, onSave, onCancel }: SkillEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'raw'>('form');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setDescription(skill.description);
      setMarkdown(skill.markdown);
      setRawContent(skill.content);
    } else {
      const template = createSkillTemplate('my-skill', 'Description of your skill');
      setRawContent(template);
      try {
        const { frontmatter, markdown } = parseSkillFile(template);
        setName(frontmatter.name);
        setDescription(frontmatter.description);
        setMarkdown(markdown);
      } catch (error) {
        // Ignore parse errors for template
      }
    }
  }, [skill]);

  const handleFormChange = () => {
    // When form fields change, regenerate the raw content
    try {
      const newContent = generateSkillFile({ name, description }, markdown);
      setRawContent(newContent);
    } catch (error) {
      // Ignore errors while typing
    }
  };

  const handleRawChange = (newRaw: string) => {
    setRawContent(newRaw);
    // Try to parse and update form fields
    try {
      const { frontmatter, markdown } = parseSkillFile(newRaw);
      setName(frontmatter.name);
      setDescription(frontmatter.description);
      setMarkdown(markdown);
    } catch (error) {
      // Ignore parse errors while editing
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate using parser
      const { frontmatter } = parseSkillFile(rawContent);

      if (mode === 'create') {
        await skillsService.createSkill(rawContent);
        toast.success(`Created skill: ${frontmatter.name}`);
      } else if (skill) {
        await skillsService.updateSkill(skill.id, rawContent);
        toast.success(`Updated skill: ${frontmatter.name}`);
      }

      onSave();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save skill';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'form') {
      handleFormChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, markdown, activeTab]);

  return (
    <YStack backgroundColor="$background" height="inherit">
      {/* Header */}
      <YStack borderBottomWidth={1} paddingHorizontal="$5" paddingVertical="$4" flexShrink={0}>
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <H1 fontSize="$8" fontWeight="500">
                {mode === 'create' ? 'Create New Skill' : 'Edit Skill'}
              </H1>
              <Paragraph fontSize="$3" color="$color11">
                Define specialized knowledge for the AI assistant
              </Paragraph>
            </div>
          </XStack>
          <XStack gap="$2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Skill'}
            </Button>
          </XStack>
        </XStack>
      </YStack>

      {/* Editor Tabs */}
      <YStack flex={1} overflow="scroll">
        <YStack borderBottomWidth={1} paddingHorizontal="$5" flexShrink={0}>
          <XStack gap="$2">
            <Button
              onClick={() => setActiveTab('form')}
              variant="ghost"
              paddingHorizontal="$4" paddingVertical="$2" borderBottomWidth={2} borderColor={activeTab === 'form' ? "$color12" : "transparent"}
            >
              <SizableText fontSize="$3" fontWeight="500" color={activeTab === 'form' ? "$color12" : "$color11"}>Form Editor</SizableText>
            </Button>
            <Button
              onClick={() => setActiveTab('raw')}
              variant="ghost"
              paddingHorizontal="$4" paddingVertical="$2" borderBottomWidth={2} borderColor={activeTab === 'raw' ? "$color12" : "transparent"}
            >
              <SizableText fontSize="$3" fontWeight="500" color={activeTab === 'raw' ? "$color12" : "$color11"}>Raw Markdown</SizableText>
            </Button>
          </XStack>
        </YStack>

        {activeTab === 'form' && (
          <YStack flex={1} paddingHorizontal="$5" paddingVertical="$4" overflow="scroll">
            <YStack rowGap="$5">
              <div>
                <Label htmlFor="name">Skill Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., react-hooks, python-testing, ui-design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  marginTop="$1.5"
  />
                <Paragraph fontSize="$1" color="$color11" marginTop="$1">
                  Lowercase with hyphens (will be used as file name)
                </Paragraph>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this skill covers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  marginTop="$1.5"
  />
                <Paragraph fontSize="$1" color="$color11" marginTop="$1">
                  Max 200 characters - shown in skills list
                </Paragraph>
              </div>

              <div>
                <Label htmlFor="markdown">Skill Content *</Label>
                <Textarea
                  id="markdown"
                  placeholder="Write the skill content in markdown format...&#10;&#10;## Guidelines&#10;- Guideline 1&#10;- Guideline 2&#10;&#10;## Examples&#10;```javascript&#10;// Example code&#10;```"
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  marginTop="$1.5" fontFamily="$mono" fontSize="$3" minHeight={400}
  />
                <Paragraph fontSize="$1" color="$color11" marginTop="$1">
                  Markdown content that the AI will read when using this skill
                </Paragraph>
              </div>

              <YStack backgroundColor="$color3" borderRadius="$5" padding="$4">
                <H3 fontWeight="500" marginBottom="$2" alignItems="center" gap="$2">
                  <FileText size={16} />
                  Tips for Writing Skills
                </H3>
                <SizableText fontSize="$3" color="$color11" rowGap="$1" marginLeft="$4.5" display="flex" flexDirection="column">
                  <li>Be specific and actionable - provide clear guidelines and examples</li>
                  <li>Use markdown formatting for better readability</li>
                  <li>Include code examples where relevant</li>
                  <li>Focus on practical knowledge the AI can apply</li>
                  <li>Keep it concise but comprehensive</li>
                </SizableText>
              </YStack>
            </YStack>
          </YStack>
        )}

        {activeTab === 'raw' && (
          <YStack flex={1} overflow="scroll" paddingHorizontal="$5" paddingVertical="$4">
            <YStack maxWidth={896}>
              <div>
                <Label htmlFor="raw-content">Raw SKILL.md Content</Label>
                <Textarea
                  id="raw-content"
                  value={rawContent}
                  onChange={(e) => handleRawChange(e.target.value)}
                  marginTop="$1.5" fontFamily="$mono" fontSize="$3" minHeight={600}
                  spellCheck={false}
  />
                <Paragraph fontSize="$1" color="$color11" marginTop="$1">
                  Direct editing of the SKILL.md file (YAML frontmatter + markdown)
                </Paragraph>
              </div>
            </YStack>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
