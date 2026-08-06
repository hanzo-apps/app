'use client';

import { YStack } from '@hanzo/ui';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@hanzo/ui';
import { DataBrowser } from './data-browser';
import { SchemaViewer } from './schema-viewer';
import { SqlEditor } from './sql-editor';
import { FunctionsManager } from './functions-manager';
import { ServerFunctionsManager } from './server-functions-manager';
import { SecretsManager } from './secrets-manager';
import { ScheduledFunctionsManager } from './scheduled-functions-manager';
import { LogsViewer } from './logs-viewer';
import { Database, Code2, Terminal, ScrollText, Wrench, Key, Clock, Table2 } from 'lucide-react';

interface DatabaseManagerProps {
  deploymentId: string;
}

export function DatabaseManager({ deploymentId }: DatabaseManagerProps) {
  const [activeTab, setActiveTab] = useState('data');

  return (
    <YStack height="100%">
      <Tabs value={activeTab} onValueChange={setActiveTab} flex={1} flexDirection="column">
        <TabsList width="100%">
          <TabsTrigger value="data" alignItems="center" gap="$1.5">
            <Table2 size={14} />
            Data
          </TabsTrigger>
          <TabsTrigger value="schema" alignItems="center" gap="$1.5">
            <Database size={14} />
            Schema
          </TabsTrigger>
          <TabsTrigger value="query" alignItems="center" gap="$1.5">
            <Terminal size={14} />
            SQL
          </TabsTrigger>
          <TabsTrigger value="functions" alignItems="center" gap="$1.5">
            <Code2 size={14} />
            Functions
          </TabsTrigger>
          <TabsTrigger value="helpers" alignItems="center" gap="$1.5">
            <Wrench size={14} />
            Helpers
          </TabsTrigger>
          <TabsTrigger value="secrets" alignItems="center" gap="$1.5">
            <Key size={14} />
            Secrets
          </TabsTrigger>
          <TabsTrigger value="schedules" alignItems="center" gap="$1.5">
            <Clock size={14} />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="logs" alignItems="center" gap="$1.5">
            <ScrollText size={14} />
            Logs
          </TabsTrigger>
        </TabsList>

        <YStack flex={1} overflow="hidden" marginTop="$4">
          <TabsContent value="data" height="100%" margin="$0">
            <DataBrowser deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="schema" height="100%" margin="$0">
            <SchemaViewer deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="query" height="100%" margin="$0">
            <SqlEditor deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="functions" height="100%" margin="$0">
            <FunctionsManager deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="helpers" height="100%" margin="$0">
            <ServerFunctionsManager deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="secrets" height="100%" margin="$0">
            <SecretsManager deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="schedules" height="100%" margin="$0">
            <ScheduledFunctionsManager deploymentId={deploymentId} />
          </TabsContent>

          <TabsContent value="logs" height="100%" margin="$0">
            <LogsViewer deploymentId={deploymentId} />
          </TabsContent>
        </YStack>
      </Tabs>
    </YStack>
  );
}

export { DataBrowser } from './data-browser';
export { SchemaViewer } from './schema-viewer';
export { SqlEditor } from './sql-editor';
export { FunctionsManager } from './functions-manager';
export { ServerFunctionsManager } from './server-functions-manager';
export { SecretsManager } from './secrets-manager';
export { ScheduledFunctionsManager } from './scheduled-functions-manager';
export { LogsViewer } from './logs-viewer';
