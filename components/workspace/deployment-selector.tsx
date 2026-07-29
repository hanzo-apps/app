'use client';

import { SizableText, XStack, Paragraph } from '@hanzo/gui';
import { useEffect, useState } from 'react';
import { Deployment } from '@/lib/vfs/types';
import { Server, Database, Loader2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tooltip, TooltipContent, TooltipTrigger, Button } from '@hanzo/ui';
interface DeploymentSelectorProps {
  projectId: string;
  selectedDeploymentId: string | null;
  onDeploymentChange: (deploymentId: string | null, deploymentName: string | null) => void;
  className?: string;
}

export function DeploymentSelector({
  projectId,
  selectedDeploymentId,
  onDeploymentChange,
  className,
}: DeploymentSelectorProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch deployments for this project
  useEffect(() => {
    const fetchDeployments = async () => {
      // Only fetch in server mode
      if (process.env.NEXT_PUBLIC_SERVER_MODE !== 'true') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/deployments`);
        if (!response.ok) {
          throw new Error('Failed to fetch deployments');
        }

        const data = await response.json();
        setDeployments(data.deployments || []);

        // Auto-select first deployment if only one exists and nothing is selected
        if (data.deployments?.length === 1 && !selectedDeploymentId) {
          const deployment = data.deployments[0];
          if (deployment.databaseEnabled) {
            onDeploymentChange(deployment.id, deployment.name);
          }
        }
      } catch {
        // Expected in browser mode or when project hasn't been synced to server yet
        // Don't show error — deployments are optional
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [projectId]); // Only refetch when project changes

  // Don't render in browser mode
  if (process.env.NEXT_PUBLIC_SERVER_MODE !== 'true') {
    return null;
  }

  // Don't render if no deployments with database enabled
  const databaseEnabledDeployments = deployments.filter(s => s.databaseEnabled);
  if (!loading && databaseEnabledDeployments.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <SizableText alignItems="center" gap="$2" fontSize="$3" color="$color11" display="flex" flexDirection="row" className={`${className}`}>
        <Loader2 size={16} />
        <span>Loading deployments...</span>
      </SizableText>
    );
  }

  if (error) {
    return (
      <SizableText alignItems="center" gap="$2" fontSize="$3" color="$red9" display="flex" flexDirection="row" className={`${className}`}>
        <Server size={16} />
        <span>{error}</span>
      </SizableText>
    );
  }

  const selectedDeployment = deployments.find(s => s.id === selectedDeploymentId);

  return (
    <XStack alignItems="center" gap="$2" className={`${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SizableText alignItems="center" gap="$1.5" color="$color11" display="flex" flexDirection="row">
            <Database size={16} />
          </SizableText>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Backend</p>
          <Paragraph fontSize="$1" color="$color11">
            Connect to a deployment for database, edge functions, and secrets
          </Paragraph>
        </TooltipContent>
      </Tooltip>

      <Select
        value={selectedDeploymentId || 'none'}
        onValueChange={(value) => {
          if (value === 'none') {
            onDeploymentChange(null, null);
          } else {
            const deployment = deployments.find(s => s.id === value);
            onDeploymentChange(value, deployment?.name || null);
          }
        }}
      >
        <SelectTrigger height="$6" width={180}>
          <SelectValue placeholder="No deployment connected" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <SizableText color="$color11">No deployment</SizableText>
          </SelectItem>
          {databaseEnabledDeployments.map((deployment) => (
            <SelectItem key={deployment.id} value={deployment.id}>
              <XStack alignItems="center" gap="$2">
                <Server size={14} />
                <span>{deployment.name}</span>
              </XStack>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedDeployment && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              height="$6" width="$6"
              onClick={() => onDeploymentChange(null, null)}
            >
              <X size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Disconnect deployment</TooltipContent>
        </Tooltip>
      )}
    </XStack>
  );
}
