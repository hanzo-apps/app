'use client';

import { useEffect, useState } from 'react';

interface PublicDeploymentProps {
  projectId?: string;
}

export function PublicDeployment({ projectId }: PublicDeploymentProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeployment() {
      try {
        // Fetch the published project's index.html
        const url = projectId
          ? `/api/deployments/${projectId}/index.html`
          : '/api/deployments/published/index.html';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('No published deployment found');
        }

        const content = await response.text();
        setHtml(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load site');
      } finally {
        setLoading(false);
      }
    }

    loadDeployment();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-neutral-100 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading deployment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            No Published Deployment
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Go to <a href="/admin" className="text-blue-600 hover:underline">/admin</a> to publish a project.
          </p>
        </div>
      </div>
    );
  }

  // Render the HTML in an iframe for isolation
  return (
    <iframe
      srcDoc={html}
      title="Published Deployment"
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
