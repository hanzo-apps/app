'use client';

import { useState, useEffect } from 'react';
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Loader2, CheckCircle, XCircle, Server } from 'lucide-react';
import { toast } from 'sonner';

export function LocalAISettings() {
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const [nodeConfig, setNodeConfig] = useState({
    host: 'localhost',
    port: '3690',
  });

  useEffect(() => {
    // Check connection on mount
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    setConnectionStatus('checking');

    try {
      const response = await fetch('/api/local-ai');
      const data = await response.json();

      if (data.available) {
        setConnectionStatus('connected');
        toast.success('Connected to local Hanzo daemon');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    } finally {
      setIsChecking(false);
    }
  };

  const saveConfiguration = () => {
    // Save to localStorage for persistence
    localStorage.setItem('hanzo-node-config', JSON.stringify(nodeConfig));
    toast.success('Configuration saved');
    checkConnection();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          Local AI Node Settings
        </CardTitle>
        <CardDescription>
          Connect to your local Hanzo daemon for private AI processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {connectionStatus === 'connected' ? (
              <Badge className="bg-green-500/10 text-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : connectionStatus === 'checking' ? (
              <Badge className="bg-yellow-500/10 text-yellow-500">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Checking
              </Badge>
            ) : (
              <Badge className="bg-red-500/10 text-red-500">
                <XCircle className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkConnection}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>

        {/* Quick Connect Options */}
        <div className="space-y-2">
          <Label>Quick Connect</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNodeConfig({ host: 'localhost', port: '3690' });
                checkConnection();
              }}
            >
              Local Daemon (3690)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNodeConfig({ host: 'localhost', port: '3691' });
                checkConnection();
              }}
            >
              Desktop App (3691)
            </Button>
          </div>
        </div>

        {/* Manual Configuration */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={nodeConfig.host}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNodeConfig({ ...nodeConfig, host: e.target.value })}
              placeholder="localhost"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              value={nodeConfig.port}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNodeConfig({ ...nodeConfig, port: e.target.value })}
              placeholder="3690"
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p>• Start local daemon: <code className="px-1 py-0.5 bg-background rounded">hanzod --port 3690</code></p>
          <p>• Or connect to Hanzo Desktop app running on port 3691</p>
          <p>• Local connections don't require API keys for operational simplicity</p>
        </div>

        {/* Save Button */}
        <Button
          className="w-full"
          onClick={saveConfiguration}
        >
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}