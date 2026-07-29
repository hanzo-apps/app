'use client';

import { XStack, SizableText, YStack, Paragraph, H3, H2 } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Skill } from '@/lib/vfs/skills/types';
import { skillsService } from '@/lib/vfs/skills';
import { logger } from '@/lib/utils';
import { Button, Input, Badge, Switch, Label, Collapsible, CollapsibleContent, CollapsibleTrigger, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, toast } from '@hanzo/ui';
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Power
} from 'lucide-react';
import { SkillEditor } from './SkillEditor';

export function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [evaluationEnabled, setEvaluationEnabled] = useState(false);
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSkills();
    loadEnabledState();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const allSkills = await skillsService.getAllSkills();
      setSkills(allSkills);
    } catch (error) {
      logger.error('[SkillsManager] Failed to load skills', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const loadEnabledState = async () => {
    try {
      const isGlobalEnabled = await skillsService.isGloballyEnabled();
      setGlobalEnabled(isGlobalEnabled);
      const isEvalEnabled = await skillsService.isEvaluationEnabled();
      setEvaluationEnabled(isEvalEnabled);

      // Load enabled state for all skills
      const allSkills = await skillsService.getAllSkills();
      const enabled = new Set<string>();

      for (const skill of allSkills) {
        const isEnabled = await skillsService.isSkillEnabled(skill.id);
        if (isEnabled) {
          enabled.add(skill.id);
        }
      }

      setEnabledSkills(enabled);
    } catch (error) {
      logger.error('[SkillsManager] Failed to load enabled state', error);
    }
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    try {
      await skillsService.setGlobalEnabled(enabled);
      setGlobalEnabled(enabled);
      toast.success(enabled ? 'Skills enabled' : 'Skills disabled');
    } catch (error) {
      toast.error('Failed to update skills state');
    }
  };

  const handleEvaluationToggle = async (enabled: boolean) => {
    try {
      await skillsService.setEvaluationEnabled(enabled);
      setEvaluationEnabled(enabled);
      toast.success(enabled ? 'Skill evaluation enabled' : 'Skill evaluation disabled');
    } catch {
      toast.error('Failed to update evaluation state');
    }
  };

  const handleSkillToggle = async (skillId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await skillsService.enableSkill(skillId);
        setEnabledSkills(prev => new Set([...prev, skillId]));
      } else {
        await skillsService.disableSkill(skillId);
        setEnabledSkills(prev => {
          const newSet = new Set(prev);
          newSet.delete(skillId);
          return newSet;
        });
      }
    } catch (error) {
      toast.error('Failed to toggle skill');
    }
  };

  const handleCreateNew = () => {
    setSelectedSkill(null);
    setEditorMode('create');
  };

  const handleEdit = (skill: Skill) => {
    setSelectedSkill(skill);
    setEditorMode('edit');
  };

  const handleDelete = (skill: Skill) => {
    setSkillToDelete(skill);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;

    try {
      await skillsService.deleteSkill(skillToDelete.id);
      toast.success(`Deleted skill: ${skillToDelete.name}`);
      await loadSkills();
      await loadEnabledState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete skill';
      toast.error(message);
    } finally {
      setDeleteConfirmOpen(false);
      setSkillToDelete(null);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.zip';
    input.multiple = false;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        if (file.name.endsWith('.zip')) {
          const skills = await skillsService.importSkills(file);
          toast.success(`Imported ${skills.length} skill(s)`);
        } else {
          const skill = await skillsService.importSkillFile(file);
          toast.success(`Imported skill: ${skill.name}`);
        }
        await loadSkills();
        await loadEnabledState();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to import skill';
        toast.error(message);
      }
    };

    input.click();
  };

  const handleExportAll = async () => {
    try {
      const customSkills = skills.filter(s => !s.isBuiltIn);
      if (customSkills.length === 0) {
        toast.error('No custom skills to export');
        return;
      }

      const blob = await skillsService.exportSkills(customSkills.map(s => s.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hanzo-skills-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${customSkills.length} skill(s)`);
    } catch (error) {
      toast.error('Failed to export skills');
    }
  };

  const handleEditorSave = async () => {
    setEditorMode(null);
    setSelectedSkill(null);
    await loadSkills();
    await loadEnabledState();
  };

  const handleEditorCancel = () => {
    setEditorMode(null);
    setSelectedSkill(null);
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const builtInSkills = filteredSkills.filter(s => s.isBuiltIn);
  const customSkills = filteredSkills.filter(s => !s.isBuiltIn);

  if (loading) {
    return (
      <XStack alignItems="center" justifyContent="center" height="100%">
        <SizableText textAlign="center" display="flex" flexDirection="column">
          <YStack borderRadius="$10" height="$8" width="$8" borderBottomWidth={2} borderColor="$color12" alignSelf="center"></YStack>
          <Paragraph marginTop="$4">Loading skills...</Paragraph>
        </SizableText>
      </XStack>
    );
  }

  return (
    <>
      <YStack height="100%">
        {/* Toolbar */}
        <YStack paddingTop="$4" paddingHorizontal="$4" paddingBottom="$3" flexShrink={0} $sm={{ paddingTop: "$5", paddingHorizontal: "$5", paddingBottom: "$3" }}>
          <YStack alignSelf="center" maxWidth={896} gap="$3">
            <YStack gap="$3" $sm={{ flexDirection: "row" }}>
              {/* Search */}
              <YStack position="relative" flex={1}>
                <Search size={16} color="$color11" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  paddingLeft={36}
  />
              </YStack>

              {/* Actions */}
              <XStack alignItems="center" gap="$2">
                <Button variant="outline" size="sm" onClick={handleImport} height="$7" $sm={{ height: 36 }}>
                  <Upload size={16} />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportAll} height="$7" $sm={{ height: 36 }}>
                  <Download size={16} />
                  Export
                </Button>
                <Button onClick={handleCreateNew} size="sm" height="$7" $sm={{ height: 36 }}>
                  <Plus size={16} />
                  New
                </Button>
              </XStack>
            </YStack>

            {/* Global Enable/Disable Toggle */}
            <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$color3" borderRadius="$5" borderWidth={1} borderColor="$borderColor">
              <XStack alignItems="center" gap="$2">
                <Power size={16} />
                <Label htmlFor="global-toggle" fontSize="$3" fontWeight="500" cursor="pointer">
                  Enable Skills System
                </Label>
              </XStack>
              <Switch
                id="global-toggle"
                checked={globalEnabled}
                onCheckedChange={handleGlobalToggle}
  />
            </XStack>

            {/* Skill Evaluation Toggle */}
            <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$color3" borderRadius="$5" borderWidth={1} borderColor="$borderColor">
              <XStack alignItems="center" gap="$2">
                <Sparkles size={16} />
                <div>
                  <Label htmlFor="eval-toggle" fontSize="$3" fontWeight="500" cursor="pointer">
                    Skill Evaluation
                  </Label>
                  <Paragraph fontSize="$1" color="$color11">
                    Pre-check which skills are relevant before each message. Increases initial token usage per message.
                  </Paragraph>
                </div>
              </XStack>
              <Switch
                id="eval-toggle"
                checked={evaluationEnabled}
                disabled={!globalEnabled}
                onCheckedChange={handleEvaluationToggle}
  />
            </XStack>
          </YStack>
        </YStack>

        {/* Skills List */}
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$3" paddingBottom="$4" overflow="scroll" $sm={{ paddingHorizontal: "$5", paddingTop: "$3", paddingBottom: "$5" }}>
          <YStack alignSelf="center" maxWidth={896}>
            {filteredSkills.length === 0 ? (
              <SizableText textAlign="center" paddingVertical="$8" display="flex" flexDirection="column">
                <Sparkles size={48} color="$color11" />
                <H3 fontSize="$6" fontWeight="500" marginBottom="$2">No skills found</H3>
                <Paragraph color="$color11" marginBottom="$4">
                  {searchQuery ? 'Try a different search query' : 'Create your first custom skill'}
                </Paragraph>
                {!searchQuery && (
                  <Button onClick={handleCreateNew}>
                    <Plus size={16} />
                    Create Skill
                  </Button>
                )}
              </SizableText>
            ) : (
              <YStack rowGap="$5">
                {/* Built-in Skills */}
                {builtInSkills.length > 0 && (
                  <div>
                    <H2 fontSize="$6" fontWeight="500" marginBottom="$3" alignItems="center" gap="$2">
                      <FileText size={20} />
                      Built-in Skills ({builtInSkills.length})
                    </H2>
                    <YStack gap="$3">
                      {builtInSkills.map(skill => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          isEnabled={enabledSkills.has(skill.id)}
                          globalEnabled={globalEnabled}
                          onToggle={handleSkillToggle}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
  />
                      ))}
                    </YStack>
                  </div>
                )}

                {/* Custom Skills */}
                {customSkills.length > 0 && (
                  <div>
                    <H2 fontSize="$6" fontWeight="500" marginBottom="$3" alignItems="center" gap="$2">
                      <Sparkles size={20} />
                      Custom Skills ({customSkills.length})
                    </H2>
                    <YStack gap="$3">
                      {customSkills.map(skill => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          isEnabled={enabledSkills.has(skill.id)}
                          globalEnabled={globalEnabled}
                          onToggle={handleSkillToggle}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
  />
                      ))}
                    </YStack>
                  </div>
                )}
              </YStack>
            )}
          </YStack>
        </YStack>
      </YStack>

      {/* Editor Dialog */}
      <Dialog open={!!editorMode} onOpenChange={(open) => !open && handleEditorCancel()}>
        <DialogContent maxWidth="90vw" height="90vh" padding="$0" overflow="hidden" $sm={{ maxWidth: "85vw" }} $lg={{ maxWidth: "75vw" }} $xl={{ maxWidth: 1200 }}>
          {editorMode && (
            <SkillEditor
              skill={selectedSkill}
              mode={editorMode}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
  />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{skillToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SkillCardProps {
  skill: Skill;
  isEnabled: boolean;
  globalEnabled: boolean;
  onToggle: (skillId: string, enabled: boolean) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
}

function SkillCard({ skill, isEnabled, globalEnabled, onToggle, onEdit, onDelete }: SkillCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const effectiveEnabled = globalEnabled && isEnabled;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <YStack borderWidth={1} borderRadius="$5" {...{ borderColor: effectiveEnabled ? "$color12" : "$borderColor", backgroundColor: effectiveEnabled ? "$color12" : undefined }}>
        <YStack padding="$4">
          <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
            <YStack flex={1} minWidth={0}>
              <XStack alignItems="center" gap="$2" marginBottom="$2">
                <CollapsibleTrigger alignItems="center" gap="$2" hoverStyle={{ color: "$color12" }}>
                  {isOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <H3 fontWeight="500" numberOfLines={1}>{skill.name}</H3>
                </CollapsibleTrigger>
                {skill.isBuiltIn && (
                  <Badge variant="secondary" fontSize="$1">
                    Built-in
                  </Badge>
                )}
                {!effectiveEnabled && (
                  <Badge variant="outline" fontSize="$1" color="$color11">
                    Disabled
                  </Badge>
                )}
              </XStack>
              <Paragraph fontSize="$3" color="$color11" numberOfLines={2}>
                {skill.description}
              </Paragraph>
            </YStack>
            <XStack alignItems="center" gap="$2">
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onToggle(skill.id, checked)}
                disabled={!globalEnabled}
  />
              {!skill.isBuiltIn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(skill)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(skill)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </XStack>
          </XStack>
        </YStack>

        <CollapsibleContent>
          <YStack borderTopWidth={1} paddingHorizontal="$4" paddingVertical="$3" backgroundColor="$color3">
            <SizableText fontSize="$3" rowGap="$2" display="flex" flexDirection="column">
              <SizableText alignItems="center" gap="$2" color="$color11" display="flex" flexDirection="row">
                <SizableText fontWeight="500">Updated:</SizableText>
                <span>{skill.updatedAt.toLocaleDateString()}</span>
              </SizableText>
              <div>
                <SizableText fontWeight="500" color="$color11">Description:</SizableText>
                <Paragraph marginTop="$1">{skill.description}</Paragraph>
              </div>
              <div>
                <SizableText fontWeight="500" color="$color11">Content:</SizableText>
                <SizableText marginTop="$1" fontSize="$1" backgroundColor="$background" padding="$3" borderRadius="$2" borderWidth={1} overflow="scroll" maxHeight={384} whiteSpace="pre" fontFamily="$mono">
                  {skill.markdown}
                </SizableText>
              </div>
            </SizableText>
          </YStack>
        </CollapsibleContent>
      </YStack>
    </Collapsible>
  );
}
