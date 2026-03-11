import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  trigger: string;
  steps: WorkflowStep[];
  lastRun?: Date;
  runCount: number;
}

const WorkflowsWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock workflows data
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Morning Routine',
      description: 'Start your day with automated tasks',
      icon: '☀️',
      enabled: true,
      trigger: 'time:08:00',
      steps: [
        { id: 's1', type: 'action', name: 'Open Calendar', config: { app: 'Calendar' } },
        { id: 's2', type: 'action', name: 'Check Weather', config: { location: 'current' } },
        { id: 's3', type: 'action', name: 'Open Email', config: { app: 'Mail' } },
      ],
      lastRun: new Date(Date.now() - 86400000),
      runCount: 45,
    },
    {
      id: '2',
      name: 'Screenshot to Clipboard',
      description: 'Take screenshot and copy to clipboard with timestamp',
      icon: '📸',
      enabled: true,
      trigger: 'hotkey:cmd+shift+4',
      steps: [
        { id: 's1', type: 'action', name: 'Take Screenshot', config: { type: 'selection' } },
        { id: 's2', type: 'action', name: 'Add Timestamp', config: { format: 'YYYY-MM-DD_HH-mm-ss' } },
        { id: 's3', type: 'action', name: 'Copy to Clipboard', config: {} },
      ],
      runCount: 128,
    },
    {
      id: '3',
      name: 'Git Commit Flow',
      description: 'Automated git workflow for commits',
      icon: '🔄',
      enabled: false,
      trigger: 'hotkey:cmd+shift+c',
      steps: [
        { id: 's1', type: 'action', name: 'Git Add All', config: { command: 'git add .' } },
        { id: 's2', type: 'action', name: 'Show Diff', config: { command: 'git diff --staged' } },
        { id: 's3', type: 'condition', name: 'If Changes', config: { condition: 'hasChanges' } },
        { id: 's4', type: 'action', name: 'Commit with Message', config: { prompt: true } },
      ],
      runCount: 67,
    },
  ]);

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredWorkflows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleToggleWorkflow();
    } else if (e.metaKey && e.key === 'n') {
      e.preventDefault();
      handleNewWorkflow();
    } else if (e.metaKey && e.key === 'e') {
      e.preventDefault();
      handleEditWorkflow();
    } else if (e.key === 'Delete' && e.metaKey) {
      e.preventDefault();
      handleDeleteWorkflow();
    }
  };

  const handleToggleWorkflow = () => {
    const workflow = filteredWorkflows[selectedIndex];
    if (workflow) {
      workflow.enabled = !workflow.enabled;
      setWorkflows([...workflows]);
      store.native?.showToast(
        workflow.enabled ? `Enabled "${workflow.name}"` : `Disabled "${workflow.name}"`,
        'success'
      );
    }
  };

  const handleNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: 'Add a description',
      icon: '⚡',
      enabled: false,
      trigger: 'manual',
      steps: [],
      runCount: 0,
    };
    setEditingWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const handleEditWorkflow = () => {
    const workflow = filteredWorkflows[selectedIndex];
    if (workflow) {
      setEditingWorkflow({ ...workflow });
      setIsEditing(true);
    }
  };

  const handleDeleteWorkflow = () => {
    const workflow = filteredWorkflows[selectedIndex];
    if (workflow) {
      setWorkflows(workflows.filter(w => w.id !== workflow.id));
      store.native?.showToast(`Deleted "${workflow.name}"`, 'success');
    }
  };

  const handleSaveWorkflow = () => {
    if (editingWorkflow) {
      const index = workflows.findIndex(w => w.id === editingWorkflow.id);
      if (index >= 0) {
        workflows[index] = editingWorkflow;
      } else {
        workflows.push(editingWorkflow);
      }
      setWorkflows([...workflows]);
      setIsEditing(false);
      setEditingWorkflow(null);
      store.native?.showToast('Workflow saved', 'success');
    }
  };

  const getTriggerIcon = (trigger: string) => {
    if (trigger.startsWith('time:')) return '⏰';
    if (trigger.startsWith('hotkey:')) return '⌨️';
    if (trigger.startsWith('file:')) return '📁';
    if (trigger === 'manual') return '👆';
    return '🔧';
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger': return '▶️';
      case 'action': return '⚡';
      case 'condition': return '🔀';
      default: return '📦';
    }
  };

  if (isEditing && editingWorkflow) {
    return (
      <div className="hanzo-window" style={{ height: '600px' }}>
        <div className="hanzo-search">
          <img 
            src={Assets.HanzoWhiteSmall} 
            alt="Hanzo" 
            className="hanzo-search-icon"
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          <h2 className="text-lg font-semibold">
            {editingWorkflow.id === Date.now().toString() ? 'New Workflow' : 'Edit Workflow'}
          </h2>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="hanzo-form">
            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Name</label>
              <input
                type="text"
                value={editingWorkflow.name}
                onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                className="hanzo-form-input"
                placeholder="Workflow name"
              />
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Description</label>
              <input
                type="text"
                value={editingWorkflow.description}
                onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                className="hanzo-form-input"
                placeholder="What does this workflow do?"
              />
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Icon</label>
              <div className="flex gap-2">
                {['⚡', '🔄', '📸', '☀️', '🌙', '💾', '📧', '🔔'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditingWorkflow({ ...editingWorkflow, icon })}
                    className={clsx(
                      'w-10 h-10 rounded-lg border-2 text-lg',
                      editingWorkflow.icon === icon
                        ? 'border-[var(--hanzo-accent)] bg-[var(--hanzo-selection)]'
                        : 'border-[var(--hanzo-border)] hover:border-[var(--hanzo-text-tertiary)]'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Trigger</label>
              <select
                value={editingWorkflow.trigger}
                onChange={(e) => setEditingWorkflow({ ...editingWorkflow, trigger: e.target.value })}
                className="hanzo-form-input"
              >
                <option value="manual">Manual</option>
                <option value="hotkey:cmd+shift+w">Hotkey (⌘⇧W)</option>
                <option value="time:08:00">Time (8:00 AM)</option>
                <option value="file:created">File Created</option>
              </select>
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Steps</label>
              <div className="space-y-2">
                {editingWorkflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--hanzo-bg-secondary)]">
                    <span>{getStepIcon(step.type)}</span>
                    <span className="flex-1">{step.name}</span>
                    <button className="text-[var(--hanzo-text-tertiary)] hover:text-[var(--hanzo-text)]">
                      ✕
                    </button>
                  </div>
                ))}
                <button className="w-full p-2 border-2 border-dashed border-[var(--hanzo-border)] rounded-lg hover:border-[var(--hanzo-accent)] transition-colors">
                  + Add Step
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleSaveWorkflow} className="hanzo-button">
                Save Workflow
              </button>
              <button onClick={() => setIsEditing(false)} className="hanzo-button secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hanzo-window" style={{ height: '500px' }}>
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search workflows..."
          className="hanzo-search-input"
        />
      </div>

      <div className="hanzo-results">
        {filteredWorkflows.length === 0 ? (
          <div className="hanzo-empty">
            <div className="hanzo-empty-icon">🔧</div>
            <div className="hanzo-empty-title">No workflows found</div>
            <div className="hanzo-empty-subtitle">Press ⌘N to create a new workflow</div>
          </div>
        ) : (
          <div className="p-2">
            {filteredWorkflows.map((workflow, index) => (
              <div
                key={workflow.id}
                className={clsx('hanzo-item', selectedIndex === index && 'selected')}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={handleToggleWorkflow}
              >
                <div className="hanzo-item-icon">
                  <span className="text-2xl">{workflow.icon}</span>
                </div>
                <div className="hanzo-item-content">
                  <div className="hanzo-item-title flex items-center gap-2">
                    {workflow.name}
                    {!workflow.enabled && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--hanzo-bg-tertiary)] text-[var(--hanzo-text-tertiary)]">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="hanzo-item-subtitle">
                    {workflow.description} • {workflow.steps.length} steps
                  </div>
                </div>
                <div className="hanzo-item-accessories">
                  <span className="hanzo-item-badge">{getTriggerIcon(workflow.trigger)}</span>
                  <span className="hanzo-item-badge">{workflow.runCount} runs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="↵" size="small" /> Toggle
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="N" size="small" /> New
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="E" size="small" /> Edit
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="⌫" size="small" /> Delete
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{filteredWorkflows.length} workflows</span>
        </div>
      </div>
    </div>
  );
});

export { WorkflowsWidget };