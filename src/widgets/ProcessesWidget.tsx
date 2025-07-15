import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { invoke } from '@tauri-apps/api/tauri';
import { uiStore } from '@/stores/ui.store';

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

const ProcessesWidget = observer(() => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadProcesses = async () => {
    try {
      const procs = await invoke<Process[]>('get_processes');
      setProcesses(procs);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load processes:', error);
      setIsLoading(false);
    }
  };

  const handleKillProcess = async (pid: number) => {
    if (confirm('Are you sure you want to kill this process?')) {
      try {
        await invoke('kill_process', { pid });
        await loadProcesses();
      } catch (error) {
        console.error('Failed to kill process:', error);
      }
    }
  };

  const filteredProcesses = processes.filter(proc =>
    proc.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="widget processes-widget">
      <div className="widget-header mb-4">
        <h2 className="text-2xl font-bold">Process Manager</h2>
        <p className="text-sm text-text-secondary">
          {processes.length} processes • Click to kill • ESC to go back
        </p>
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter processes..."
        className="search-input mb-4"
      />

      {isLoading ? (
        <div className="loading">
          <p className="text-text-secondary">Loading processes...</p>
        </div>
      ) : (
        <div className="processes-list">
          {filteredProcesses.map((proc) => (
            <div
              key={proc.pid}
              className="process-item result-item"
              onClick={() => handleKillProcess(proc.pid)}
            >
              <div className="process-info">
                <div className="process-name">{proc.name}</div>
                <div className="process-pid text-xs text-text-secondary">
                  PID: {proc.pid}
                </div>
              </div>
              <div className="process-stats text-sm text-text-secondary">
                <span>CPU: {proc.cpu.toFixed(1)}%</span>
                <span className="ml-4">MEM: {proc.memory.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ProcessesWidget;