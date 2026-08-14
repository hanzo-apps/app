'use client';

import { XStack, SizableText, YStack, Paragraph, H4, H3 } from '@hanzo/ui';
import { useState, useEffect, useCallback } from 'react';
import { CustomTemplate, BackendFeatures } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { templateService } from '@/lib/vfs/template-service';
import { createProjectFromTemplate, BUILT_IN_TEMPLATES, type BuiltInTemplateMetadata } from '@/lib/vfs/templates';
import { BAREBONES_PROJECT_TEMPLATE, DEMO_PROJECT_TEMPLATE, CONTACT_LANDING_PROJECT_TEMPLATE, BLOG_PROJECT_TEMPLATE, VIBE_CHECK_PROJECT_TEMPLATE } from '@/lib/vfs/project-templates';
import { Button, Input, toast, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Popover, PopoverContent, PopoverTrigger } from '@hanzo/ui';
import { TemplateCard } from './template-card';
import { logger } from '@/lib/utils';
import { provisionBackendFeatures } from '@/lib/vfs/provision-backend-features';
import {
  Upload,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Package,
  Filter
} from 'lucide-react';

interface TemplateManagerProps {
  onProjectCreated?: (projectId: string, hasBackendFeatures: boolean) => void;
}

type SortOption = 'updated' | 'name' | 'author' | 'files';
type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'standard' | 'server';

export function TemplateManager({ onProjectCreated }: TemplateManagerProps) {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const loadCustomTemplates = useCallback(async () => {
    try {
      setLoading(true);
      await vfs.init();
      const templates = await templateService.listCustomTemplates();
      setCustomTemplates(templates);
    } catch (error) {
      logger.error('Failed to load custom templates:', error);
      toast.error('Could not open your saved templates. Reload the page to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  const handleImportTemplate = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.oswt';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await templateService.importTemplateFile(file);
        toast.success('Template imported');
        await loadCustomTemplates();
      } catch (error) {
        logger.error('Failed to import template:', error);
        toast.error(error instanceof Error ? error.message : 'Could not read that file. Templates are .oswt files exported from Hanzo.');
      }
    };

    input.click();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? Projects already made from it are not affected.')) {
      return;
    }

    try {
      await templateService.deleteCustomTemplate(id);
      toast.success('Template deleted');
      await loadCustomTemplates();
    } catch (error) {
      logger.error('Failed to delete template:', error);
      toast.error('Could not delete the template. Reload the page and try again.');
    }
  };

  const handleExportTemplate = async (template: CustomTemplate | BuiltInTemplateMetadata) => {
    try {
      // For built-in templates, create a custom template export
      if ('isBuiltIn' in template && template.isBuiltIn) {
        toast.info('Packaging this built-in template as a .oswt file…');

        // Create a temporary project to export
        const tempProject = await vfs.createProject(
          template.name,
          template.description
        );

        // Populate with template content
        if (template.id === 'blank') {
          await createProjectFromTemplate(vfs, tempProject.id, BAREBONES_PROJECT_TEMPLATE);
        } else if (template.id === 'demo') {
          await createProjectFromTemplate(vfs, tempProject.id, DEMO_PROJECT_TEMPLATE, DEMO_PROJECT_TEMPLATE.assets);
        } else if (template.id === 'contact-landing') {
          await createProjectFromTemplate(vfs, tempProject.id, CONTACT_LANDING_PROJECT_TEMPLATE);
        } else if (template.id === 'blog') {
          await createProjectFromTemplate(vfs, tempProject.id, BLOG_PROJECT_TEMPLATE);
        } else if (template.id === 'vibe-check') {
          await createProjectFromTemplate(vfs, tempProject.id, VIBE_CHECK_PROJECT_TEMPLATE);
        }

        // Export as template
        const blob = await templateService.exportProjectAsTemplate(vfs, tempProject.id, {
          name: template.name,
          description: template.description,
          version: '1.0.0',
          author: 'Hanzo App',
          license: 'mit',
          tags: template.metadata?.tags || []
        });

        // Clean up temp project
        await vfs.deleteProject(tempProject.id);

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.oswt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Template downloaded');
      } else {
        // Custom template - re-export
        const customTemplate = template as CustomTemplate;
        const blob = await templateService.exportTemplateAsFile(customTemplate);

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customTemplate.name.replace(/\s+/g, '-').toLowerCase()}.oswt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Template downloaded');
      }
    } catch (error) {
      logger.error('Failed to export template:', error);
      toast.error('Could not package the template. Reload the page and try again.');
    }
  };

  const handleCreateProject = async (template: CustomTemplate | BuiltInTemplateMetadata) => {
    try {
      setCreating(true);

      const projectName = template.name === 'Website Starter' || template.name === 'Example Studios'
        ? `New ${template.name} Project`
        : template.name;

      const project = await vfs.createProject(
        projectName,
        template.description
      );

      // Use built-in template or custom template
      let backendFeatures: BackendFeatures | undefined;

      if ('isBuiltIn' in template && template.isBuiltIn) {
        if (template.id === 'blank') {
          await createProjectFromTemplate(vfs, project.id, BAREBONES_PROJECT_TEMPLATE);
        } else if (template.id === 'demo') {
          await createProjectFromTemplate(vfs, project.id, DEMO_PROJECT_TEMPLATE, DEMO_PROJECT_TEMPLATE.assets);
        } else if (template.id === 'contact-landing') {
          await createProjectFromTemplate(vfs, project.id, CONTACT_LANDING_PROJECT_TEMPLATE);
        } else if (template.id === 'blog') {
          await createProjectFromTemplate(vfs, project.id, BLOG_PROJECT_TEMPLATE);
        } else if (template.id === 'vibe-check') {
          await createProjectFromTemplate(vfs, project.id, VIBE_CHECK_PROJECT_TEMPLATE);
        }

        backendFeatures = template.backendFeatures;
      } else {
        // Custom template
        const customTemplate = template as CustomTemplate;
        await createProjectFromTemplate(vfs, project.id, {
          name: customTemplate.name,
          description: customTemplate.description,
          files: customTemplate.files.map(f => ({
            path: f.path,
            content: typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content as ArrayBuffer)
          })),
          directories: customTemplate.directories,
          assets: customTemplate.assets
        });

        backendFeatures = customTemplate.backendFeatures;
      }

      // Provision backend features into project IndexedDB stores
      if (backendFeatures) {
        try {
          const result = await provisionBackendFeatures(project.id, backendFeatures);

          // Summary toast
          const parts: string[] = [];
          if (result.edgeFunctions > 0) parts.push(`${result.edgeFunctions} edge function(s)`);
          if (result.serverFunctions > 0) parts.push(`${result.serverFunctions} server function(s)`);
          if (result.secrets > 0) parts.push(`${result.secrets} secret placeholder(s)`);
          if (result.hasDatabaseSchema) parts.push('database schema');
          if (parts.length > 0) {
            toast.success(`Backend set up: ${parts.join(', ')}`, { duration: 5000 });
          }
        } catch (provisionError) {
          logger.error('Failed to provision backend features:', provisionError);
          toast.warning(
            'Project created, but its database and functions were not set up. Open Backend from the project menu to add them.',
            { duration: 6000 }
          );
        }
      }

      toast.success(`Created "${project.name}"`);

      if (onProjectCreated) {
        onProjectCreated(project.id, !!backendFeatures);
      }
    } catch (error) {
      logger.error('Failed to create project from template:', error);
      toast.error(`Could not start a project from "${template.name}". Reload the page and try again.`);
    } finally {
      setCreating(false);
    }
  };

  // Combine all templates
  const allTemplates: (CustomTemplate | BuiltInTemplateMetadata)[] = [
    ...BUILT_IN_TEMPLATES,
    ...customTemplates
  ];

  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      ('metadata' in template && template.metadata?.author?.toLowerCase().includes(query)) ||
      ('metadata' in template && template.metadata?.tags?.some(tag => tag.toLowerCase().includes(query)));

    // Type filter
    if (typeFilter !== 'all') {
      const hasBackendFeatures = 'backendFeatures' in template && !!template.backendFeatures;
      if (typeFilter === 'server' && !hasBackendFeatures) return false;
      if (typeFilter === 'standard' && hasBackendFeatures) return false;
    }

    return matchesSearch;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'updated':
        const aDate = ('updatedAt' in a && a.updatedAt) ? a.updatedAt : new Date('2024-01-01');
        const bDate = ('updatedAt' in b && b.updatedAt) ? b.updatedAt : new Date('2024-01-01');
        return bDate.getTime() - aDate.getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'author':
        const aAuthor = ('metadata' in a && a.metadata?.author) || '';
        const bAuthor = ('metadata' in b && b.metadata?.author) || '';
        return aAuthor.localeCompare(bAuthor);
      case 'files':
        const aFiles = 'files' in a ? a.files?.length || 0 : 0;
        const bFiles = 'files' in b ? b.files?.length || 0 : 0;
        return bFiles - aFiles;
      default:
        return 0;
    }
  });

  if (loading || creating) {
    return (
      <XStack alignItems="center" justifyContent="center" height="100%">
        <SizableText textAlign="center" display="flex" flexDirection="column">
          <YStack borderRadius="$10" height="$8" width="$8" borderBottomWidth={2} borderColor="$color11" alignSelf="center"></YStack>
          <Paragraph marginTop="$4">{creating ? 'Setting up your project…' : 'Loading templates…'}</Paragraph>
        </SizableText>
      </XStack>
    );
  }

  return (
    <YStack height="100%">
      {/* Toolbar */}
      <YStack paddingTop="$4" paddingHorizontal="$4" paddingBottom="$3" flexShrink={0} $sm={{ paddingTop: "$5", paddingHorizontal: "$5", paddingBottom: "$3" }}>
        <YStack alignSelf="center" maxWidth={1280} gap="$3" $sm={{ flexDirection: "row" }}>
        {/* Search */}
        <YStack position="relative" flex={1}>
          <Search size={16} />
          <Input
            placeholder="Search templates…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            paddingLeft={36}
  />
        </YStack>

        {/* Controls */}
        <XStack alignItems="center" gap="$2">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
            <SelectTrigger width={110} height={36}>
              <Filter size={16} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="server">Backend</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" gap="$2">
                <ArrowUpDown size={16} />
                <SizableText display="none" $sm={{ display: "inline" }}>Sort</SizableText>
              </Button>
            </PopoverTrigger>
            <PopoverContent width="$19" align="end">
              <YStack rowGap="$2">
                <H4 fontWeight="500" fontSize="$3">Sort by</H4>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last updated</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="files">File count</SelectItem>
                  </SelectContent>
                </Select>
              </YStack>
            </PopoverContent>
          </Popover>

          {/* View Mode */}
          <XStack borderWidth={1} borderColor="$borderColor" borderRadius="$10">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              borderTopRightRadius={0} borderBottomRightRadius={0} borderTopLeftRadius="$10" borderBottomLeftRadius="$10"
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              borderTopLeftRadius={0} borderBottomLeftRadius={0} borderTopRightRadius="$10" borderBottomRightRadius="$10"
            >
              <List size={16} />
            </Button>
          </XStack>

          {/* Import */}
          <Button onClick={handleImportTemplate} size="sm" gap="$2">
            <Upload size={16} />
            <span>Import</span>
          </Button>
        </XStack>
        </YStack>
      </YStack>

      {/* Templates Grid/List */}
      <YStack flex={1} minHeight={0} paddingHorizontal="$4" paddingTop="$3" paddingBottom="$4" overflow="scroll" $sm={{ paddingHorizontal: "$5", paddingTop: "$3", paddingBottom: "$5" }}>
        <YStack alignSelf="center" maxWidth={1280}>
        {sortedTemplates.length === 0 ? (
          <XStack alignItems="center" justifyContent="center" height="100%">
            <SizableText textAlign="center" maxWidth={448} display="flex" flexDirection="column">
              {searchQuery ? (
                <>
                  <Search size={48} />
                  <H3 fontWeight="500" marginBottom="$2">Nothing matches that search</H3>
                  <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                    No template name, description, author or tag contains &quot;{searchQuery}&quot;.
                  </Paragraph>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <Package size={48} />
                  <H3 fontWeight="500" marginBottom="$2">No custom templates yet</H3>
                  <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                    A template is a project saved as a starting point. Export one from a project you like, or import a .oswt file someone sent you.
                  </Paragraph>
                  <Button onClick={handleImportTemplate}>
                    <Upload size={16} />
                    Import a template
                  </Button>
                </>
              )}
            </SizableText>
          </XStack>
        ) : (
          <YStack {...{ gap: viewMode === 'grid' ? "$4" : undefined, rowGap: viewMode === 'grid' ? undefined : "$3" }}>
            {sortedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleCreateProject}
                onDelete={handleDeleteTemplate}
                onExport={handleExportTemplate}
                viewMode={viewMode}
  />
            ))}
          </YStack>
        )}
        </YStack>
      </YStack>
    </YStack>
  );
}
