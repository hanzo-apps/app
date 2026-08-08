'use client';

import { YStack, XStack, H3, Paragraph, SizableText, H2 } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, toast, Popover, PopoverContent, PopoverTrigger } from '@hanzo/ui';
import { MultiAgentOrchestrator } from '@/lib/llm/multi-agent-orchestrator';
import { testScenarios, testTracks } from '@/lib/testing/test-scenarios';
import type { AssertionResult } from '@/lib/testing/types';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp, Square, Download, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { ModelSettingsPanel } from '@/components/settings/model-settings';
import { configManager } from '@/lib/config/storage';
import { AppHeader, HeaderAction } from '@/components/ui/app-header';

interface ToolCallDetail {
  name: string;
  status: 'success' | 'failed';
  args?: string;
}

const KNOWN_TOOLS = new Set(['shell', 'write', 'evaluation']);

interface ToolStats {
  total: number;
  success: number;
  failed: number;
  invalid: number;
  invalidNames: string[];
  breakdown: Record<string, { total: number; success: number; failed: number }>;
}

function computeToolStats(details: ToolCallDetail[]): ToolStats {
  const breakdown: Record<string, { total: number; success: number; failed: number }> = {};
  let success = 0, failed = 0, invalid = 0;
  const invalidNameSet = new Set<string>();

  for (const d of details) {
    if (!KNOWN_TOOLS.has(d.name)) {
      invalid++;
      invalidNameSet.add(d.name);
    } else if (d.status === 'success') {
      success++;
    } else {
      failed++;
    }

    if (!breakdown[d.name]) breakdown[d.name] = { total: 0, success: 0, failed: 0 };
    breakdown[d.name].total++;
    if (d.status === 'success') breakdown[d.name].success++;
    else breakdown[d.name].failed++;
  }

  return { total: details.length, success, failed, invalid, invalidNames: [...invalidNameSet], breakdown };
}

function formatCost(amount: number): string {
  if (amount > 0 && amount < 0.0001) return '< $0.0001';
  return `$${amount.toFixed(4)}`;
}

interface ProgressDelta {
  text?: string;
  snapshot?: string;
}

interface ProgressToolStatus {
  toolName?: string;
  status?: string;
  args?: string;
}

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'stopped';
  executionTime?: number;
  errors?: string[];
  details?: string;
  toolCalls?: number;
  generationOutput?: string;
  totalCost?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  toolCallDetails?: ToolCallDetail[];
  assertionResults?: AssertionResult[];
  assertionScore?: number;
  judgeResult?: { passed: boolean; reasoning: string };
  selfEvalCorrect?: boolean;
}

interface RoundResult {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'stopped';
  executionTime?: number;
  totalCost?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  toolCalls?: number;
  toolCallDetails?: ToolCallDetail[];
  assertionResults?: AssertionResult[];
  assertionScore?: number;
  judgeResult?: { passed: boolean; reasoning: string };
  selfEvalCorrect?: boolean;
  errors?: string[];
  details?: string;
}

interface AggregatedTestResult {
  id: string;
  name: string;
  roundCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  avgCost: number;
  totalCost: number;
  avgTokens: number;
  avgToolCalls: number;
  avgAssertionScore?: number;
  rounds: RoundResult[];
}

const allScenarioIds = testScenarios.map(s => s.id);

export default function TestGenerationPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>(
    testScenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      status: 'pending'
    }))
  );
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [orchestratorInstances, setOrchestratorInstances] = useState<Map<string, MultiAgentOrchestrator>>(new Map());
  const [generationOutputs, setGenerationOutputs] = useState<Map<string, string>>(new Map());
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const generationOutputRefs = useRef<Map<string, GuiElement>>(new Map());
  const batchCancelledRef = useRef(false);
  const [overallStats, setOverallStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0,
    totalCost: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    toolStats: { total: 0, success: 0, failed: 0, invalid: 0, invalidNames: [] as string[], breakdown: {} } as ToolStats,
  });

  // Model settings popover state
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [currentModel, setCurrentModel] = useState('');

  // Judge model settings
  const [judgeModel, setJudgeModel] = useState('');

  // Multi-round state
  const [totalRounds, setTotalRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundHistory, setRoundHistory] = useState<RoundResult[][]>([]);
  const [benchmarkComplete, setBenchmarkComplete] = useState(false);
  const testResultsRef = useRef<TestResult[]>([]);

  useEffect(() => { testResultsRef.current = testResults; }, [testResults]);

  useEffect(() => {
    setCurrentModel(configManager.getDefaultModel());
  }, []);

  const getModelDisplayName = (modelId: string) => {
    if (!modelId) return 'Select Model';
    const parts = modelId.split('/');
    const modelName = parts[parts.length - 1];
    return modelName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const runSingleTest = async (scenarioId: string) => {
    const scenario = testScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const startTime = Date.now();
    setRunningTest(scenarioId);
    setExpandedTests(prev => new Set([...prev, scenarioId]));

    // Update status to running
    setTestResults(prev => prev.map(result =>
      result.id === scenarioId
        ? { ...result, status: 'running', generationOutput: '' }
        : result
    ));

    let projectId = '';
    const toolDetails: ToolCallDetail[] = [];
    try {
      projectId = `test-${Date.now()}`;

      const { vfs } = await import('@/lib/vfs');
      await vfs.init();
      await vfs.createProject(`Test: ${scenario.name}`, undefined, projectId);

      if (scenario.setupFiles) {
        for (const [filePath, content] of Object.entries(scenario.setupFiles)) {
          await vfs.createFile(projectId, filePath, content);
        }
      }

      const appendOutput = (scenarioId: string, text: string) => {
        setGenerationOutputs(prev => {
          const newMap = new Map(prev);
          newMap.set(scenarioId, (newMap.get(scenarioId) || '') + text);
          return newMap;
        });
        setTestResults(prev => prev.map(result =>
          result.id === scenarioId
            ? { ...result, generationOutput: (result.generationOutput || '') + text }
            : result
        ));
        setTimeout(() => {
          const outputElement = generationOutputRefs.current.get(scenarioId);
          if (outputElement && 'scrollTo' in outputElement) {
            outputElement.scrollTop = outputElement.scrollHeight;
          }
        }, 0);
      };

      const orchestrator = new MultiAgentOrchestrator(
        projectId,
        'orchestrator',
        (message, step) => {
          if (message === 'assistant_delta') {
            const delta = step as ProgressDelta;
            const deltaText = delta?.text;
            const snapshot = delta?.snapshot;
            if (!deltaText && !snapshot) return;

            if (snapshot !== undefined) {
              setGenerationOutputs(prev => {
                const newMap = new Map(prev);
                newMap.set(scenarioId, snapshot);
                return newMap;
              });
              setTestResults(prev => prev.map(result =>
                result.id === scenarioId
                  ? { ...result, generationOutput: snapshot }
                  : result
              ));
            } else if (deltaText) {
              appendOutput(scenarioId, deltaText);
            }

            setTimeout(() => {
              const outputElement = generationOutputRefs.current.get(scenarioId);
              if (outputElement && 'scrollTo' in outputElement) {
                outputElement.scrollTop = outputElement.scrollHeight;
              }
            }, 0);
          }

          if (message === 'tool_status') {
            const data = step as ProgressToolStatus;
            const toolName = data?.toolName || 'unknown';
            if (data?.status === 'executing') {
              let argSnippet = '';
              if (data?.args) {
                try {
                  const parsed = JSON.parse(data.args);
                  if (toolName === 'shell') argSnippet = parsed.cmd || parsed.command || '';
                  else if (toolName === 'write') argSnippet = parsed.path || parsed.filePath || '';
                  else if (toolName === 'evaluation') {
                    const g = parsed.goal_achieved;
                    argSnippet = g !== undefined ? `goal_achieved: ${g}` : '';
                  }
                } catch {}
                if (argSnippet.length > 80) argSnippet = argSnippet.substring(0, 77) + '...';
              }
              toolDetails.push({ name: toolName, status: 'success', args: argSnippet });
              appendOutput(scenarioId, `\n[tool] ${toolName}${argSnippet ? ` — ${argSnippet}` : ' ...'}\n`);
            } else if (data?.status === 'completed') {
              appendOutput(scenarioId, `[tool] ${toolName} done\n`);
            } else if (data?.status === 'failed') {
              const last = [...toolDetails].reverse().find(d => d.name === toolName);
              if (last) last.status = 'failed';
              appendOutput(scenarioId, `[tool] ${toolName} failed\n`);
            }
          }
        },
        { chatMode: false }
      );

      setOrchestratorInstances(prev => {
        const newMap = new Map(prev);
        newMap.set(scenarioId, orchestrator);
        return newMap;
      });

      const result = await orchestrator.execute(scenario.prompt);

      const toolCallCount = (result.conversation || []).reduce((count, node) => {
        return count + node.messages.reduce((msgCount, msg) => {
          return msgCount + (msg.tool_calls?.length || 0);
        }, 0);
      }, 0);

      // Extract detailed tool calls from conversation (more authoritative — has args)
      const conversationToolDetails: ToolCallDetail[] = [];
      const toolResultMap = new Map<string, boolean>();
      for (const node of (result.conversation || [])) {
        for (const msg of node.messages) {
          if (msg.role === 'tool' && msg.tool_call_id) {
            const content = typeof msg.content === 'string' ? msg.content : '';
            toolResultMap.set(msg.tool_call_id, !content.startsWith('Error:'));
          }
        }
        for (const msg of node.messages) {
          if (msg.tool_calls) {
            for (const tc of msg.tool_calls) {
              let argSnippet = '';
              try {
                const parsed = JSON.parse(tc.function.arguments);
                if (tc.function.name === 'shell') {
                  argSnippet = parsed.cmd || parsed.command || '';
                } else if (tc.function.name === 'write') {
                  argSnippet = parsed.path || parsed.filePath || '';
                } else if (tc.function.name === 'evaluation') {
                  const goal = parsed.goal_achieved;
                  argSnippet = goal !== undefined ? `goal_achieved: ${goal}` : '';
                }
              } catch {}
              if (argSnippet.length > 80) argSnippet = argSnippet.substring(0, 77) + '...';

              const succeeded = toolResultMap.has(tc.id) ? toolResultMap.get(tc.id)! : true;
              conversationToolDetails.push({
                name: tc.function.name,
                status: succeeded ? 'success' : 'failed',
                args: argSnippet,
              });
            }
          }
        }
      }

      const finalToolDetails = conversationToolDetails.length > 0 ? conversationToolDetails : toolDetails;

      // Run programmatic assertions (before project cleanup)
      let assertionResults: AssertionResult[] = [];
      if (scenario.assertions && scenario.assertions.length > 0) {
        try {
          const { runAssertions } = await import('@/lib/testing/assertion-runner');
          assertionResults = await runAssertions(projectId, result.conversation || [], scenario.assertions);
        } catch (err) {
          console.warn('Assertion runner error:', err);
        }
      }

      // Run judge assertions (if configured)
      const judgeAssertions = scenario.assertions?.filter(a => a.type === 'judge') || [];
      let judgeResult: { passed: boolean; reasoning: string } | undefined;
      if (judgeAssertions.length > 0 && judgeModel) {
        try {
          const { vfs: vfsInst } = await import('@/lib/vfs');
          const files = await vfsInst.listFiles(projectId);
          const fileContents: Record<string, string> = {};
          for (const f of files) {
            if (typeof f.content === 'string') {
              fileContents[f.path] = f.content;
            }
          }

          const judgeProvider = configManager.getSelectedProvider();
          const judgeApiKey = configManager.getProviderApiKey(judgeProvider) || '';
          const { runJudgeEvaluation } = await import('@/lib/testing/judge');
          judgeResult = await runJudgeEvaluation(
            judgeAssertions[0].criteria,
            { prompt: scenario.prompt, files: fileContents, summary: result.summary },
            { provider: judgeProvider, apiKey: judgeApiKey, model: judgeModel }
          );

          assertionResults.push({
            assertion: judgeAssertions[0],
            passed: judgeResult.passed,
            actual: judgeResult.reasoning,
          });
        } catch (err) {
          console.warn('Judge evaluation error:', err);
        }
      }

      // Compute assertion score and determine pass/fail
      const assertionScore = assertionResults.length > 0
        ? (assertionResults.filter(r => r.passed).length / assertionResults.length) * 100
        : undefined;

      const testPassed = assertionResults.length > 0
        ? assertionResults.every(r => r.passed)
        : result.success;

      setTestResults(prev => prev.map(testResult =>
        testResult.id === scenarioId
          ? {
              ...testResult,
              status: testPassed ? 'success' : 'failed',
              executionTime: Date.now() - startTime,
              errors: testPassed
                ? undefined
                : assertionResults.length > 0
                  ? assertionResults.filter(r => !r.passed).map(r => r.assertion.description + (r.actual ? ` — ${r.actual}` : ''))
                  : [result.summary],
              details: result.summary,
              toolCalls: toolCallCount,
              totalCost: result.totalCost,
              promptTokens: result.totalUsage.promptTokens,
              completionTokens: result.totalUsage.completionTokens,
              totalTokens: result.totalUsage.totalTokens,
              toolCallDetails: finalToolDetails,
              assertionResults: assertionResults.length > 0 ? assertionResults : undefined,
              assertionScore,
              judgeResult,
              selfEvalCorrect: assertionResults.length > 0 ? result.success === testPassed : undefined,
            }
          : testResult
      ));

      if (testPassed) {
        toast.success(`Test passed: ${scenario.name}`);
      } else {
        toast.error(`Test failed: ${scenario.name}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      setTestResults(prev => prev.map(result =>
        result.id === scenarioId
          ? {
              ...result,
              status: 'failed',
              executionTime: Date.now() - startTime,
              errors: [errorMessage],
              details: `Error: ${errorMessage}`,
              toolCallDetails: toolDetails.length > 0 ? toolDetails : undefined,
            }
          : result
      ));

      toast.error(`Test error: ${scenario.name}`);
    }

    setOrchestratorInstances(prev => {
      const newMap = new Map(prev);
      newMap.delete(scenarioId);
      return newMap;
    });

    if (projectId) {
      try {
        const { vfs } = await import('@/lib/vfs');
        await vfs.deleteProject(projectId);
      } catch {}
    }

    setRunningTest(null);
  };

  const stopTest = (scenarioId: string) => {
    const orchestrator = orchestratorInstances.get(scenarioId);
    if (orchestrator) {
      orchestrator.stop();
      toast.info(`Stopping test: ${testScenarios.find(s => s.id === scenarioId)?.name}`);
    }
  };

  const runTrack = async (trackId: string) => {
    const scenarioIds = trackId === 'all'
      ? allScenarioIds
      : testTracks.find(t => t.id === trackId)?.scenarioIds || [];

    if (scenarioIds.length === 0) return;

    setActiveTrack(trackId);
    batchCancelledRef.current = false;
    setRoundHistory([]);
    setBenchmarkComplete(false);

    for (let round = 0; round < totalRounds; round++) {
      if (batchCancelledRef.current) break;
      setCurrentRound(round);

      // Reset test results to pending for this round
      setTestResults(
        testScenarios.map(scenario => ({
          id: scenario.id,
          name: scenario.name,
          status: 'pending'
        }))
      );
      setGenerationOutputs(new Map());

      for (const testId of scenarioIds) {
        if (batchCancelledRef.current) break;
        await runSingleTest(testId);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Snapshot completed results for this round
      const snapshot: RoundResult[] = testResultsRef.current
        .filter(r => r.status === 'success' || r.status === 'failed' || r.status === 'stopped')
        .map(r => ({
          id: r.id,
          name: r.name,
          status: r.status as 'success' | 'failed' | 'stopped',
          executionTime: r.executionTime,
          totalCost: r.totalCost,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          toolCalls: r.toolCalls,
          toolCallDetails: r.toolCallDetails,
          assertionResults: r.assertionResults,
          assertionScore: r.assertionScore,
          judgeResult: r.judgeResult,
          selfEvalCorrect: r.selfEvalCorrect,
          errors: r.errors,
          details: r.details,
        }));
      setRoundHistory(prev => [...prev, snapshot]);
    }

    setBenchmarkComplete(true);
    setActiveTrack(null);
  };

  // Derive overall stats from testResults reactively
  useEffect(() => {
    const completed = testResults.filter(r => r.status !== 'pending' && r.status !== 'running');
    const passed = testResults.filter(r => r.status === 'success');

    const totalCost = completed.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const promptTokens = completed.reduce((sum, r) => sum + (r.promptTokens || 0), 0);
    const completionTokens = completed.reduce((sum, r) => sum + (r.completionTokens || 0), 0);
    const totalTokens = completed.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
    const allToolDetails = completed.flatMap(r => r.toolCallDetails || []);
    const toolStats = computeToolStats(allToolDetails);

    setOverallStats({
      total: completed.length,
      passed: passed.length,
      failed: completed.length - passed.length,
      successRate: completed.length > 0 ? (passed.length / completed.length) * 100 : 0,
      totalCost,
      promptTokens,
      completionTokens,
      totalTokens,
      toolStats,
    });
  }, [testResults]);

  const stopBenchmark = () => {
    batchCancelledRef.current = true;
    orchestratorInstances.forEach((orchestrator) => {
      orchestrator.stop();
    });
  };

  const resetTests = () => {
    stopBenchmark();
    setTestResults(
      testScenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        status: 'pending'
      }))
    );
    setOverallStats({ total: 0, passed: 0, failed: 0, successRate: 0, totalCost: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, toolStats: { total: 0, success: 0, failed: 0, invalid: 0, invalidNames: [], breakdown: {} } });
    setRunningTest(null);
    setActiveTrack(null);
    setOrchestratorInstances(new Map());
    setGenerationOutputs(new Map());
    setExpandedTests(new Set());
    setRoundHistory([]);
    setCurrentRound(0);
    setBenchmarkComplete(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'stopped': return <Square size={16} />;
      case 'running': return <RefreshCw size={16} />;
      default: return <Clock size={16} />;
    }
  };

  // Compute per-track report data
  const trackReports = useMemo(() => {
    const reports: Record<string, {
      total: number;
      passed: number;
      failed: number;
      successRate: number;
      avgTime: number;
      totalToolCalls: number;
      totalCost: number;
      totalTokens: number;
      toolStats: ToolStats;
      totalAssertions: number;
      passedAssertions: number;
      assertionScore: number;
      selfEvalTotal: number;
      selfEvalCorrect: number;
      allDone: boolean;
      results: TestResult[];
    }> = {};

    for (const track of testTracks) {
      const trackResults = track.scenarioIds
        .map(id => testResults.find(r => r.id === id))
        .filter((r): r is TestResult => r !== undefined);

      const terminal = trackResults.filter(r => r.status === 'success' || r.status === 'failed' || r.status === 'stopped');
      const passed = terminal.filter(r => r.status === 'success');
      const allDone = terminal.length === trackResults.length && terminal.length > 0;
      const times = terminal.filter(r => r.executionTime).map(r => r.executionTime!);
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const totalToolCalls = terminal.reduce((sum, r) => sum + (r.toolCalls || 0), 0);
      const totalCost = terminal.reduce((sum, r) => sum + (r.totalCost || 0), 0);
      const totalTokens = terminal.reduce((sum, r) => sum + (r.totalTokens || 0), 0);

      const allDetails = terminal.flatMap(r => r.toolCallDetails || []);
      const toolStats = computeToolStats(allDetails);

      const totalAssertions = terminal.reduce((sum, r) => sum + (r.assertionResults?.length || 0), 0);
      const passedAssertions = terminal.reduce((sum, r) =>
        sum + (r.assertionResults?.filter(a => a.passed).length || 0), 0);
      const assertionScore = totalAssertions > 0 ? (passedAssertions / totalAssertions) * 100 : 0;

      const selfEvalTotal = terminal.filter(r => r.selfEvalCorrect !== undefined).length;
      const selfEvalCorrectCount = terminal.filter(r => r.selfEvalCorrect === true).length;

      reports[track.id] = {
        total: trackResults.length,
        passed: passed.length,
        failed: terminal.length - passed.length,
        successRate: terminal.length > 0 ? (passed.length / terminal.length) * 100 : 0,
        avgTime,
        totalToolCalls,
        totalCost,
        totalTokens,
        toolStats,
        totalAssertions,
        passedAssertions,
        assertionScore,
        selfEvalTotal,
        selfEvalCorrect: selfEvalCorrectCount,
        allDone,
        results: trackResults,
      };
    }

    return reports;
  }, [testResults]);

  // Aggregated results across all rounds
  const aggregatedResults = useMemo((): AggregatedTestResult[] => {
    if (roundHistory.length === 0) return [];

    const scenarioMap = new Map<string, RoundResult[]>();
    for (const round of roundHistory) {
      for (const result of round) {
        const existing = scenarioMap.get(result.id) || [];
        existing.push(result);
        scenarioMap.set(result.id, existing);
      }
    }

    return Array.from(scenarioMap.entries()).map(([id, rounds]) => {
      const name = rounds[0].name;
      const passCount = rounds.filter(r => r.status === 'success').length;
      const failCount = rounds.length - passCount;
      const times = rounds.filter(r => r.executionTime).map(r => r.executionTime!);
      const costs = rounds.filter(r => r.totalCost !== undefined).map(r => r.totalCost!);
      const tokens = rounds.filter(r => r.totalTokens !== undefined).map(r => r.totalTokens!);
      const toolCalls = rounds.filter(r => r.toolCalls !== undefined).map(r => r.toolCalls!);
      const assertionScores = rounds.filter(r => r.assertionScore !== undefined).map(r => r.assertionScore!);

      return {
        id,
        name,
        roundCount: rounds.length,
        passCount,
        failCount,
        passRate: (passCount / rounds.length) * 100,
        avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        minTime: times.length > 0 ? Math.min(...times) : 0,
        maxTime: times.length > 0 ? Math.max(...times) : 0,
        avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
        totalCost: costs.reduce((a, b) => a + b, 0),
        avgTokens: tokens.length > 0 ? tokens.reduce((a, b) => a + b, 0) / tokens.length : 0,
        avgToolCalls: toolCalls.length > 0 ? toolCalls.reduce((a, b) => a + b, 0) / toolCalls.length : 0,
        avgAssertionScore: assertionScores.length > 0 ? assertionScores.reduce((a, b) => a + b, 0) / assertionScores.length : undefined,
        rounds,
      };
    });
  }, [roundHistory]);

  const aggregatedOverallStats = useMemo(() => {
    if (aggregatedResults.length === 0) return null;
    const totalTests = aggregatedResults.reduce((sum, r) => sum + r.roundCount, 0);
    const totalPassed = aggregatedResults.reduce((sum, r) => sum + r.passCount, 0);
    const totalFailed = aggregatedResults.reduce((sum, r) => sum + r.failCount, 0);
    const totalCost = aggregatedResults.reduce((sum, r) => sum + r.totalCost, 0);

    const allResults = roundHistory.flat();
    const totalTokens = allResults.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
    const promptTokens = allResults.reduce((sum, r) => sum + (r.promptTokens || 0), 0);
    const completionTokens = allResults.reduce((sum, r) => sum + (r.completionTokens || 0), 0);
    const allToolDetails = allResults.flatMap(r => r.toolCallDetails || []);
    const toolStats = computeToolStats(allToolDetails);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      totalCost,
      totalTokens,
      promptTokens,
      completionTokens,
      toolStats,
      roundsCompleted: roundHistory.length,
    };
  }, [aggregatedResults, roundHistory]);

  const isRunning = runningTest !== null;

  // Export helpers
  const buildExportData = () => {
    const provider = configManager.getSelectedProvider();
    const model = currentModel;
    const dateStr = new Date().toISOString();

    const rounds = roundHistory.length > 0
      ? roundHistory.map((round, i) => ({ round: i + 1, results: round }))
      : [{
          round: 1,
          results: testResults
            .filter(r => r.status === 'success' || r.status === 'failed' || r.status === 'stopped')
            .map(r => ({
              id: r.id,
              name: r.name,
              status: r.status as 'success' | 'failed' | 'stopped',
              executionTime: r.executionTime,
              totalCost: r.totalCost,
              promptTokens: r.promptTokens,
              completionTokens: r.completionTokens,
              totalTokens: r.totalTokens,
              toolCalls: r.toolCalls,
              toolStats: r.toolCallDetails ? computeToolStats(r.toolCallDetails) : undefined,
              assertionScore: r.assertionScore,
              selfEvalCorrect: r.selfEvalCorrect,
              errors: r.errors,
              details: r.details,
            }))
        }];

    const aggregated = aggregatedResults.length > 0
      ? aggregatedResults.map(r => ({
          id: r.id,
          name: r.name,
          roundCount: r.roundCount,
          passRate: r.passRate,
          avgTime: r.avgTime,
          minTime: r.minTime,
          maxTime: r.maxTime,
          avgCost: r.avgCost,
          totalCost: r.totalCost,
          avgTokens: r.avgTokens,
          avgToolCalls: r.avgToolCalls,
          avgAssertionScore: r.avgAssertionScore,
        }))
      : undefined;

    // Compute self-eval accuracy across all round data
    const selfEvalData = (() => {
      const allRoundResults = roundHistory.length > 0
        ? roundHistory.flat()
        : testResults.filter(r => r.status === 'success' || r.status === 'failed' || r.status === 'stopped');
      const withSelfEval = allRoundResults.filter(r => r.selfEvalCorrect !== undefined);
      const correct = withSelfEval.filter(r => r.selfEvalCorrect === true).length;
      return withSelfEval.length > 0 ? { selfEvalCorrect: correct, selfEvalTotal: withSelfEval.length } : {};
    })();

    const baseStats = aggregatedOverallStats || {
      totalTests: overallStats.total,
      totalPassed: overallStats.passed,
      totalFailed: overallStats.failed,
      passRate: overallStats.successRate,
      totalCost: overallStats.totalCost,
      totalTokens: overallStats.totalTokens,
      promptTokens: overallStats.promptTokens,
      completionTokens: overallStats.completionTokens,
      toolStats: overallStats.toolStats,
      roundsCompleted: roundHistory.length || (overallStats.total > 0 ? 1 : 0),
    };

    const summary = {
      ...baseStats,
      ...selfEvalData,
    };

    return {
      meta: {
        tool: 'Hanzo App Benchmark',
        date: dateStr,
        provider,
        model,
        judgeModel: judgeModel || undefined,
        totalRounds: roundHistory.length || (overallStats.total > 0 ? 1 : 0),
      },
      rounds,
      aggregated,
      summary,
    };
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getExportFilename = (ext: string) => {
    const modelSlug = currentModel.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    const dateSlug = new Date().toISOString().split('T')[0];
    return `hanzo-benchmark-${modelSlug}-${dateSlug}.${ext}`;
  };

  const exportJSON = () => {
    const data = buildExportData();
    downloadFile(JSON.stringify(data, null, 2), getExportFilename('json'), 'application/json');
    toast.success('Benchmark results exported as JSON');
  };

  const exportMarkdown = () => {
    const data = buildExportData();
    const lines: string[] = [];
    lines.push('# Hanzo App Benchmark Report');
    lines.push('');
    lines.push(`**Date:** ${data.meta.date}`);
    lines.push(`**Provider:** ${data.meta.provider}`);
    lines.push(`**Model:** ${data.meta.model}`);
    if (data.meta.judgeModel) lines.push(`**Judge Model:** ${data.meta.judgeModel}`);
    lines.push(`**Rounds:** ${data.meta.totalRounds}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Tests | ${data.summary.totalTests} |`);
    lines.push(`| Passed | ${data.summary.totalPassed} |`);
    lines.push(`| Failed | ${data.summary.totalFailed} |`);
    lines.push(`| Pass Rate | ${data.summary.passRate.toFixed(1)}% |`);
    lines.push(`| Total Cost | $${data.summary.totalCost.toFixed(4)} |`);
    if (data.summary.totalTokens) {
      lines.push(`| Total Tokens | ${data.summary.totalTokens.toLocaleString()} (${data.summary.promptTokens?.toLocaleString() || 0} in / ${data.summary.completionTokens?.toLocaleString() || 0} out) |`);
    }
    if (data.summary.toolStats && data.summary.toolStats.total > 0) {
      const ts = data.summary.toolStats;
      let toolLine = `| Tool Calls | ${ts.total} (${ts.success} ok`;
      if (ts.failed > 0) toolLine += `, ${ts.failed} failed`;
      if (ts.invalid > 0) toolLine += `, ${ts.invalid} invalid: ${ts.invalidNames.join(', ')}`;
      toolLine += ') |';
      lines.push(toolLine);
    }
    lines.push(`| Rounds | ${data.summary.roundsCompleted} |`);
    if (data.summary.selfEvalTotal) {
      lines.push(`| Self-eval Accuracy | ${data.summary.selfEvalCorrect}/${data.summary.selfEvalTotal} (${((data.summary.selfEvalCorrect! / data.summary.selfEvalTotal) * 100).toFixed(1)}%) |`);
    }
    lines.push('');

    if (data.aggregated && data.aggregated.length > 0) {
      lines.push('## Per-Test Results (Multi-Round)');
      lines.push('');
      lines.push('| Test | Pass Rate | Avg Time | Avg Cost | Avg Tokens | Avg Tools |');
      lines.push('|------|-----------|----------|----------|------------|-----------|');
      for (const r of data.aggregated) {
        lines.push(`| ${r.name} | ${r.passRate.toFixed(0)}% | ${(r.avgTime / 1000).toFixed(1)}s | $${r.avgCost.toFixed(4)} | ${Math.round(r.avgTokens).toLocaleString()} | ${r.avgToolCalls.toFixed(1)} |`);
      }
    } else if (data.rounds.length > 0 && data.rounds[0].results.length > 0) {
      lines.push('## Results');
      lines.push('');
      lines.push('| Test | Status | Time | Cost | Tokens |');
      lines.push('|------|--------|------|------|--------|');
      for (const r of data.rounds[0].results) {
        const time = r.executionTime ? `${(r.executionTime / 1000).toFixed(1)}s` : '-';
        const cost = r.totalCost !== undefined ? `$${r.totalCost.toFixed(4)}` : '-';
        const tokens = r.totalTokens !== undefined ? r.totalTokens.toLocaleString() : '-';
        lines.push(`| ${r.name} | ${r.status} | ${time} | ${cost} | ${tokens} |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('*Generated by Hanzo App Benchmark*');

    downloadFile(lines.join('\n'), getExportFilename('md'), 'text/markdown');
    toast.success('Benchmark results exported as Markdown');
  };

  const headerActions: HeaderAction[] = [
    {
      id: 'back',
      label: 'Back to Projects',
      icon: ArrowLeft,
      onClick: () => router.push('/'),
      variant: 'outline'
    }
  ];

  return (
    <YStack minHeight="100%">
      <AppHeader
        leftText="Hanzo Benchmark"
        onLogoClick={() => router.push('/')}
        actions={headerActions}
  />

      {/* Document scroll — height="100%" of an auto body is indefinite, and a
          flex-basis-0 scroll child under it clips to zero (see /templates). */}
      <YStack backgroundColor="$background" padding="$5">
        <YStack maxWidth={1152} alignSelf="center">

        {/* Info Banner */}
        <YStack backgroundColor="$blue1" borderWidth={1} borderColor="$blue3" borderRadius="$5" padding="$4" marginBottom="$5" $theme-dark={{ backgroundColor: "$blue12", borderColor: "$blue11" }}>
          <XStack alignItems="flex-start" gap="$3">
            <AlertCircle size={20} />
            <YStack flex={1}>
              <H3 fontWeight="500" color="$blue12" marginBottom="$1" $theme-dark={{ color: "$blue2" }}>How to Interpret Benchmark Results</H3>
              <Paragraph fontSize="$3" color="$blue11" $theme-dark={{ color: "$blue3" }}>
                This benchmark evaluates how well a model performs with Hanzo App&apos;s agentic tools (shell, write, evaluation).
                A <strong>passing test</strong> means the model completed the task using the right tools.
                A <strong>failing test</strong> means the model couldn&apos;t complete the task or encountered errors.
              </Paragraph>
              <YStack marginTop="$2">
                <SizableText fontSize="$1" color="$blue11" $theme-dark={{ color: "$blue4" }}>
                  <strong>Tip:</strong> Select your preferred provider and model below to benchmark specific configurations.
                  The generation output will show you what the AI is doing during execution.
                </SizableText>
              </YStack>
            </YStack>
          </XStack>
        </YStack>

        {/* Cost Warning Banner */}
        <YStack backgroundColor="$yellow1" borderWidth={1} borderColor="$yellow3" borderRadius="$5" padding="$4" marginBottom="$5" $theme-dark={{ backgroundColor: "$yellow12", borderColor: "$yellow11" }}>
          <XStack alignItems="flex-start" gap="$3">
            <YStack marginTop="$0.5"><SizableText color="$yellow10" $theme-dark={{ color: "$yellow8" }}>💡</SizableText></YStack>
            <YStack flex={1}>
              <H3 fontWeight="500" color="$yellow12" marginBottom="$1" $theme-dark={{ color: "$yellow2" }}>Cost Warning</H3>
              <Paragraph fontSize="$3" color="$yellow11" $theme-dark={{ color: "$yellow3" }}>
                Running benchmarks can be <strong>very expensive</strong> and likely isn&apos;t necessary.
                It&apos;s cheaper and easier to just use good models and research community feedback about agentic capabilities.
              </Paragraph>
              <Paragraph fontSize="$3" color="$yellow11" marginTop="$2" $theme-dark={{ color: "$yellow3" }}>
                This benchmark is for evaluating how models perform with Hanzo App&apos;s agentic system
                and using those results to improve it.
              </Paragraph>
            </YStack>
          </XStack>
        </YStack>

        {/* Round progress indicator */}
        {totalRounds > 1 && activeTrack && (
          <YStack backgroundColor="$blue1" borderWidth={1} borderColor="$blue3" borderRadius="$5" paddingHorizontal="$4" paddingVertical="$2" marginBottom="$4" $theme-dark={{ backgroundColor: "$blue12", borderColor: "$blue11" }}>
            <SizableText fontSize="$3" color="$blue11" $theme-dark={{ color: "$blue3" }}>
              Round {currentRound + 1} of {totalRounds} ({roundHistory.length} completed)
            </SizableText>
          </YStack>
        )}

        {/* Stats Overview */}
        {(() => {
          const stats = benchmarkComplete && aggregatedOverallStats && roundHistory.length > 1
            ? {
                total: aggregatedOverallStats.totalTests,
                passed: aggregatedOverallStats.totalPassed,
                failed: aggregatedOverallStats.totalFailed,
                successRate: aggregatedOverallStats.passRate,
                totalCost: aggregatedOverallStats.totalCost,
                promptTokens: aggregatedOverallStats.promptTokens,
                completionTokens: aggregatedOverallStats.completionTokens,
                totalTokens: aggregatedOverallStats.totalTokens,
                toolStats: aggregatedOverallStats.toolStats,
                rounds: aggregatedOverallStats.roundsCompleted,
              }
            : {
                total: overallStats.total,
                passed: overallStats.passed,
                failed: overallStats.failed,
                successRate: overallStats.successRate,
                totalCost: overallStats.totalCost,
                promptTokens: overallStats.promptTokens,
                completionTokens: overallStats.completionTokens,
                totalTokens: overallStats.totalTokens,
                toolStats: overallStats.toolStats,
                rounds: undefined as number | undefined,
              };

          return (
            <>
              <YStack gap="$4" marginBottom="$4">
                {stats.rounds !== undefined && (
                  <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                    <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Rounds</SizableText></YStack>
                    <YStack><SizableText fontSize="$8" fontWeight="500">{stats.rounds}</SizableText></YStack>
                  </YStack>
                )}
                <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                  <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Total Tests</SizableText></YStack>
                  <YStack><SizableText fontSize="$8" fontWeight="500">{stats.total}</SizableText></YStack>
                </YStack>
                <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                  <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Passed</SizableText></YStack>
                  <YStack><SizableText fontSize="$8" fontWeight="500" color="$green10">{stats.passed}</SizableText></YStack>
                </YStack>
                <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                  <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Failed</SizableText></YStack>
                  <YStack><SizableText fontSize="$8" fontWeight="500" color="$red10">{stats.failed}</SizableText></YStack>
                </YStack>
                <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                  <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Pass Rate</SizableText></YStack>
                  <YStack><SizableText fontSize="$8" fontWeight="500">{stats.successRate.toFixed(1)}%</SizableText></YStack>
                </YStack>
                <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                  <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Cost</SizableText></YStack>
                  <YStack><SizableText fontSize="$8" fontWeight="500">
                    {formatCost(stats.totalCost)}
                  </SizableText></YStack>
                </YStack>
                <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                  <YStack marginBottom="$1"><SizableText fontSize="$3" fontWeight="500" color="$color11">Tokens</SizableText></YStack>
                  <YStack><SizableText fontSize="$8" fontWeight="500">{stats.totalTokens.toLocaleString()}</SizableText></YStack>
                  <YStack marginTop="$0.5"><SizableText fontSize="$1" color="$color11">
                    {stats.promptTokens.toLocaleString()} in &rarr; {stats.completionTokens.toLocaleString()} out
                  </SizableText></YStack>
                </YStack>
              </YStack>

              {/* Tool usage summary */}
              {stats.toolStats.total > 0 && (() => {
                const ts = stats.toolStats;
                const knownEntries = Object.entries(ts.breakdown).filter(([name]) => KNOWN_TOOLS.has(name));
                return (
                  <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" overflow="hidden" marginBottom="$5">
                    <XStack flexWrap="wrap" alignItems="center" columnGap="$4" rowGap="$1" paddingHorizontal="$4" paddingVertical="$2.5" borderBottomWidth={1} backgroundColor="$color3">
                      <SizableText fontSize="$3" fontWeight="500">Tool Calls: {ts.total}</SizableText>
                      <SizableText fontSize="$3" color="$green10">{ts.success} successful</SizableText>
                      {ts.failed > 0 && <SizableText fontSize="$3" color="$red10">{ts.failed} failed</SizableText>}
                      {ts.invalid > 0 && <SizableText fontSize="$3" color="$orange9">{ts.invalid} invalid</SizableText>}
                    </XStack>
                    <YStack width="100%">
                      <thead>
                        <YStack>
                          <SizableText textAlign="left" paddingHorizontal="$4" paddingVertical="$1.5" fontWeight="500" fontSize="$1" color="$color11">Tool</SizableText>
                          <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$1.5" fontWeight="500" fontSize="$1" color="$color11">Total</SizableText>
                          <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$1.5" fontWeight="500" color="$green10" fontSize="$1">OK</SizableText>
                          <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$1.5" fontWeight="500" color="$red9" fontSize="$1">Failed</SizableText>
                        </YStack>
                      </thead>
                      <tbody>
                        {knownEntries.map(([name, counts]) => (
                          <YStack key={name} borderTopWidth={1} borderColor="$borderColor">
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" fontWeight="500" fontSize="$3">{name}</SizableText>
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" textAlign="right" color="$color11" fontSize="$3">{counts.total}</SizableText>
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" textAlign="right" color="$green10" fontSize="$3">{counts.success}</SizableText>
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" textAlign="right" fontSize="$3" {...{ color: counts.failed > 0 ? "$red9" : "$red9", fontWeight: counts.failed > 0 ? "500" : undefined }}>
                              {counts.failed}
                            </SizableText>
                          </YStack>
                        ))}
                        {ts.invalid > 0 && (
                          <YStack borderTopWidth={1} borderColor="$borderColor">
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" fontWeight="500" color="$orange9" fontSize="$3">invalid</SizableText>
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" textAlign="right" color="$orange9" fontSize="$3">{ts.invalid}</SizableText>
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" textAlign="right" color="$green10" fontSize="$3">0</SizableText>
                            <SizableText paddingHorizontal="$4" paddingVertical="$1.5" textAlign="right" color="$red9" fontWeight="500" fontSize="$3">{ts.invalid}</SizableText>
                          </YStack>
                        )}
                      </tbody>
                    </YStack>
                  </YStack>
                );
              })()}
            </>
          );
        })()}

        {/* Controls */}
        <XStack flexWrap="wrap" gap="$3" marginBottom="$5">
          <Popover open={showModelSettings} onOpenChange={setShowModelSettings}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <span>{getModelDisplayName(currentModel)}</span>
                {showModelSettings ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent width={384} align="start" sideOffset={4}>
              <ModelSettingsPanel
                onClose={() => setShowModelSettings(false)}
                onModelChange={(modelId) => setCurrentModel(modelId)}
                showJudgeModel
                onJudgeModelChange={(modelId) => setJudgeModel(modelId)}
  />
            </PopoverContent>
          </Popover>

          <XStack alignItems="center" borderRadius="$3" borderWidth={1} borderColor="$color2">
            <Button
              onClick={() => setTotalRounds(r => Math.max(1, r - 1))}
              disabled={isRunning || totalRounds <= 1}
              height={36} width="$6" alignItems="center" justifyContent="center" borderTopLeftRadius="$3" borderBottomLeftRadius="$3" hoverStyle={{ backgroundColor: "$color3" }} disabledStyle={{ opacity: 0.5, pointerEvents: "none" }}
            >
              <Minus size={12} />
            </Button>
            <XStack height={36} paddingHorizontal="$2" alignItems="center" justifyContent="center" minWidth="5rem" borderLeftWidth={1} borderRightWidth={1} borderColor="$color2">
              <SizableText fontSize="$3" fontWeight="500" userSelect="none">{totalRounds} Round{totalRounds > 1 ? 's' : ''}</SizableText>
            </XStack>
            <Button
              onClick={() => setTotalRounds(r => Math.min(10, r + 1))}
              disabled={isRunning || totalRounds >= 10}
              height={36} width="$6" alignItems="center" justifyContent="center" borderTopRightRadius="$3" borderBottomRightRadius="$3" hoverStyle={{ backgroundColor: "$color3" }} disabledStyle={{ opacity: 0.5, pointerEvents: "none" }}
            >
              <Plus size={12} />
            </Button>
          </XStack>

          {testTracks.map(track => (
            <Button
              key={track.id}
              onClick={() => runTrack(track.id)}
              disabled={isRunning}
              variant={activeTrack === track.id ? 'default' : 'outline'}
            >
              <Play size={16} />
              {track.name} ({track.scenarioIds.length})
            </Button>
          ))}
          <Button
            onClick={() => runTrack('all')}
            disabled={isRunning}
            variant={activeTrack === 'all' ? 'default' : 'outline'}
          >
            <Play size={16} />
            All ({allScenarioIds.length})
          </Button>
          {isRunning ? (
            <Button variant="destructive" onClick={stopBenchmark}>
              <Square size={16} />
              Stop
            </Button>
          ) : (
            <Button variant="outline" onClick={resetTests}>
              <RefreshCw size={16} />
              Reset
            </Button>
          )}

          {(overallStats.total > 0 || roundHistory.length > 0) && (
            <>
              <YStack width={1} height="$5" backgroundColor="$borderColor" alignSelf="center" />
              <Button variant="outline" onClick={exportJSON} disabled={isRunning}>
                <Download size={16} />
                JSON
              </Button>
              <Button variant="outline" onClick={exportMarkdown} disabled={isRunning}>
                <Download size={16} />
                Markdown
              </Button>
            </>
          )}
        </XStack>

        {/* Test Results — grouped by track */}
        <YStack rowGap="$6">
          {testTracks.map(track => {
            const report = trackReports[track.id];
            return (
              <div key={track.id}>
                {/* Track header */}
                <XStack alignItems="center" gap="$3" marginBottom="$3">
                  <YStack height={1} flex={1} backgroundColor="$borderColor" />
                  <H2 fontSize="$3" fontWeight="500" color="$color11">
                    {track.name}
                  </H2>
                  <SizableText fontSize="$1" color="$color11">{track.description}</SizableText>
                  <YStack height={1} flex={1} backgroundColor="$borderColor" />
                </XStack>

                {/* Scenarios in this track */}
                <YStack gap="$4">
                  {track.scenarioIds.map(scenarioId => {
                    const result = testResults.find(r => r.id === scenarioId);
                    const scenario = testScenarios.find(s => s.id === scenarioId);
                    if (!result || !scenario) return null;

                    return (
                      <YStack key={result.id} backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$4">
                        <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                          <div>
                            <XStack alignItems="center" gap="$2">
                              {getStatusIcon(result.status)}
                              <SizableText fontWeight="500">{result.name}</SizableText>
                              <SizableText fontSize="$3" fontWeight="400" color="$color11">
                                ({scenario.category})
                              </SizableText>
                            </XStack>
                            <YStack marginTop="$1"><SizableText fontSize="$3" color="$color11">
                              {scenario.prompt.substring(0, 100)}...
                            </SizableText></YStack>
                          </div>
                          <XStack alignItems="center" gap="$2">
                            {result.executionTime && (
                              <SizableText fontSize="$3" color="$color11">
                                {(result.executionTime / 1000).toFixed(1)}s
                              </SizableText>
                            )}
                            {result.status === 'running' && runningTest === result.id ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => stopTest(result.id)}
                              >
                                <Square size={12} />
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runSingleTest(result.id)}
                                disabled={isRunning}
                              >
                                <Play size={12} />
                                Test
                              </Button>
                            )}
                            {(result.status === 'running' || result.generationOutput || expandedTests.has(result.id)) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setExpandedTests(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(result.id)) {
                                      newSet.delete(result.id);
                                    } else {
                                      newSet.add(result.id);
                                    }
                                    return newSet;
                                  });
                                }}
                              >
                                {expandedTests.has(result.id) ? (
                                  <ChevronUp size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )}
                              </Button>
                            )}
                          </XStack>
                        </XStack>
                        {/* Generation Output Display */}
                        {(result.status === 'running' || expandedTests.has(result.id)) && (result.generationOutput || generationOutputs.get(result.id)) && (
                          <YStack marginTop="$3" paddingTop="$3" borderTopWidth={1}>
                            <XStack alignItems="center" gap="$2" marginBottom="$2">
                              <YStack><SizableText fontSize="$3" fontWeight="500" color="$color11">Generation Output</SizableText></YStack>
                              {result.status === 'running' && (
                                <XStack alignItems="center" gap="$1">
                                  <RefreshCw size={12} />
                                  <SizableText fontSize="$1" color="$color11">Generating...</SizableText>
                                </XStack>
                              )}
                            </XStack>
                            <YStack
                              backgroundColor="$color3" borderRadius="$3" padding="$3" maxHeight={256} overflow="scroll"
                              ref={(el) => {
                                if (el) {
                                  generationOutputRefs.current.set(result.id, el);
                                }
                              }}
                            >
                              <SizableText fontSize="$1" fontFamily="$mono" whiteSpace="pre" color="$color">
                                {result.generationOutput || generationOutputs.get(result.id) || ''}
                              </SizableText>
                            </YStack>
                          </YStack>
                        )}

                        {(result.status === 'success' || result.status === 'failed' || result.status === 'stopped') && (
                          <YStack marginTop="$3" paddingTop="$3" borderTopWidth={1} rowGap="$2">
                            {result.details && (
                              <SizableText fontSize="$3">
                                <strong>Result:</strong> {result.details}
                              </SizableText>
                            )}
                            <XStack flexWrap="wrap" columnGap="$4" rowGap="$1">
                              {result.totalCost !== undefined && (
                                <SizableText color="$color11" fontSize="$3">
                                  <SizableText color="$color">Cost:</SizableText>{' '}
                                  {formatCost(result.totalCost)}
                                </SizableText>
                              )}
                              {result.totalTokens !== undefined && (
                                <SizableText color="$color11" fontSize="$3">
                                  <SizableText color="$color">Tokens:</SizableText>{' '}
                                  {(result.promptTokens || 0).toLocaleString()} &rarr; {(result.completionTokens || 0).toLocaleString()} ({result.totalTokens.toLocaleString()} total)
                                </SizableText>
                              )}
                              {result.toolCalls !== undefined && (
                                <SizableText color="$color11" fontSize="$3">
                                  <SizableText color="$color">Tool Calls:</SizableText> {result.toolCalls}
                                </SizableText>
                              )}
                            </XStack>
                            {result.toolCallDetails && result.toolCallDetails.length > 0 && (() => {
                              const ts = computeToolStats(result.toolCallDetails);
                              return (
                                <YStack marginTop="$1">
                                  <YStack marginBottom="$1"><SizableText fontSize="$1" color="$color11">
                                    <SizableText fontWeight="500" color="$color">{ts.total} tool call{ts.total !== 1 ? 's' : ''}</SizableText>
                                    {' — '}
                                    <SizableText color="$green10">{ts.success} ok</SizableText>
                                    {ts.failed > 0 && <>, <SizableText color="$red9">{ts.failed} failed</SizableText></>}
                                    {ts.invalid > 0 && <>, <SizableText color="$orange9">{ts.invalid} invalid</SizableText></>}
                                  </SizableText></YStack>
                                  <YStack rowGap="$0.5">
                                    {result.toolCallDetails.map((tc, i) => {
                                      const isInvalid = !KNOWN_TOOLS.has(tc.name);
                                      return (
                                        <XStack key={i} alignItems="center" gap="$1.5">
                                          <SizableText fontFamily="$mono" fontSize="$1" {...{ color: tc.status === 'success' && !isInvalid ? '#22c55e' : isInvalid ? '#f97316' : '#ef4444' }}>
                                            {tc.status === 'success' && !isInvalid ? '\u2713' : '\u2717'}
                                          </SizableText>
                                          <SizableText fontFamily="$mono" fontSize="$1" fontWeight="500" {...{ color: isInvalid ? "$orange9" : undefined }}>{tc.name}</SizableText>
                                          {isInvalid && (
                                            <SizableText fontFamily="$mono" color="$orange9" fontSize="$1" borderWidth={1} borderColor="$orange8" borderRadius="$2" paddingHorizontal="$1">invalid</SizableText>
                                          )}
                                          {tc.args && (
                                            <SizableText fontFamily="$mono" fontSize="$1" color="$color11" numberOfLines={1} maxWidth={448}>
                                              &mdash; {tc.args}
                                            </SizableText>
                                          )}
                                        </XStack>
                                      );
                                    })}
                                  </YStack>
                                </YStack>
                              );
                            })()}
                            {result.assertionResults && result.assertionResults.length > 0 && (
                              <YStack marginTop="$2" paddingTop="$2" borderTopWidth={1} borderStyle="dashed">
                                <YStack marginBottom="$1"><SizableText fontSize="$1" fontWeight="500" color="$color11">
                                  Assertions: {result.assertionResults.filter(a => a.passed).length}/{result.assertionResults.length} passed
                                  {result.assertionScore !== undefined && ` (${result.assertionScore.toFixed(0)}%)`}
                                </SizableText></YStack>
                                <YStack rowGap="$0.5">
                                  {result.assertionResults.map((ar, i) => (
                                    <XStack key={i} alignItems="flex-start" gap="$1.5">
                                      <SizableText fontFamily="$mono" fontSize="$1" {...{ color: ar.passed ? "$green9" : "$red9" }}>
                                        {ar.passed ? '\u2713' : '\u2717'}
                                      </SizableText>
                                      <SizableText fontFamily="$mono" fontSize="$1" {...{ color: ar.passed ? "$color11" : "$color" }}>
                                        {ar.assertion.description}
                                      </SizableText>
                                      {!ar.passed && ar.actual && (
                                        <SizableText fontFamily="$mono" fontSize="$1" color="$red8" numberOfLines={1} maxWidth={384}>
                                          &mdash; {ar.actual}
                                        </SizableText>
                                      )}
                                    </XStack>
                                  ))}
                                </YStack>
                              </YStack>
                            )}
                            {result.errors && result.errors.length > 0 && (
                              <YStack><SizableText color="$red10">
                                <strong>Errors:</strong> {result.errors.join(', ')}
                              </SizableText></YStack>
                            )}
                          </YStack>
                        )}
                      </YStack>
                    );
                  })}
                </YStack>

                {/* Track Report — shown when all tests in this track are done */}
                {report.allDone && (
                  <YStack marginTop="$4" backgroundColor="$color3" borderWidth={1} borderRadius="$5" padding="$4">
                    <XStack flexWrap="wrap" alignItems="center" columnGap="$2" rowGap="$1" marginBottom="$3">
                      <H3 fontSize="$3" fontWeight="500">{track.name} Track Report</H3>
                      <SizableText fontSize="$1" color="$color11">
                        Passed: {report.passed}/{report.total} ({report.successRate.toFixed(1)}%)
                        {report.totalAssertions > 0 && (
                          <>&nbsp;|&nbsp; Assertions: {report.passedAssertions}/{report.totalAssertions} ({report.assertionScore.toFixed(0)}%)</>
                        )}
                        {report.selfEvalTotal > 0 && (
                          <>&nbsp;|&nbsp; Self-eval accuracy: {report.selfEvalCorrect}/{report.selfEvalTotal}</>
                        )}
                        &nbsp;|&nbsp; Avg time: {(report.avgTime / 1000).toFixed(1)}s
                        &nbsp;|&nbsp; Cost: {formatCost(report.totalCost)}
                        &nbsp;|&nbsp; Tokens: {report.totalTokens.toLocaleString()}
                        &nbsp;|&nbsp; Tool calls: {report.totalToolCalls}
                        {' ('}
                        <SizableText color="$green10">{report.toolStats.success} ok</SizableText>
                        {report.toolStats.failed > 0 && <>, <SizableText color="$red9">{report.toolStats.failed} fail</SizableText></>}
                        {report.toolStats.invalid > 0 && <>, <SizableText color="$orange9">{report.toolStats.invalid} invalid</SizableText></>}
                        {')'}
                        {Object.keys(report.toolStats.breakdown).length > 0 && (
                          <> &mdash; {Object.entries(report.toolStats.breakdown)
                            .filter(([name]) => KNOWN_TOOLS.has(name))
                            .map(([name, counts], i) => (
                            <span key={name}>
                              {i > 0 ? ', ' : ''}
                              {name}: {counts.total}
                              {counts.failed > 0 && <SizableText color="$red9"> ({counts.failed}&#x2717;)</SizableText>}
                            </span>
                          ))}</>
                        )}
                      </SizableText>
                    </XStack>
                    <YStack rowGap="$1">
                      {report.results.map(r => {
                        const isPass = r.status === 'success';
                        return (
                          <XStack key={r.id} alignItems="center" gap="$2">
                            <SizableText fontFamily="$mono" fontSize="$1" {...{ color: isPass ? "$green9" : "$red9" }}>
                              {isPass ? '\u2713' : '\u2717'}
                            </SizableText>
                            <SizableText fontFamily="$mono" fontSize="$1" width="$19" numberOfLines={1}>{r.id}</SizableText>
                            <SizableText fontFamily="$mono" fontSize="$1" width="$10" textAlign="right" color="$color11">
                              {r.executionTime ? `${(r.executionTime / 1000).toFixed(1)}s` : '—'}
                            </SizableText>
                            <SizableText fontFamily="$mono" fontSize="$1" width="$11" textAlign="right" color="$color11">
                              {r.totalCost !== undefined ? formatCost(r.totalCost) : ''}
                            </SizableText>
                            <SizableText fontFamily="$mono" fontSize="$1" width="$11" textAlign="right" color="$color11">
                              {r.totalTokens !== undefined ? `${r.totalTokens.toLocaleString()} tok` : ''}
                            </SizableText>
                            <SizableText fontFamily="$mono" fontSize="$1" width="$14" color="$color11">
                              {r.toolCallDetails && r.toolCallDetails.length > 0 ? (() => {
                                const ts = computeToolStats(r.toolCallDetails);
                                return (
                                  <>
                                    {ts.total} tools
                                    {' ('}
                                    <SizableText color="$green10">{ts.success}</SizableText>
                                    {ts.failed > 0 && <>/<SizableText color="$red9">{ts.failed}</SizableText></>}
                                    {ts.invalid > 0 && <>/<SizableText color="$orange9">{ts.invalid}!</SizableText></>}
                                    {')'}
                                  </>
                                );
                              })() : r.toolCalls !== undefined ? `${r.toolCalls} tools` : ''}
                            </SizableText>
                            {r.assertionScore !== undefined && (
                              <SizableText fontFamily="$mono" fontSize="$1" width="$10" textAlign="right" {...{ color: r.assertionScore === 100 ? '#22c55e' : r.assertionScore > 0 ? '#eab308' : '#ef4444' }}>
                                {r.assertionScore.toFixed(0)}%
                              </SizableText>
                            )}
                            {r.errors && r.errors.length > 0 && (
                              <SizableText fontFamily="$mono" fontSize="$1" color="$red9" numberOfLines={1}>— {r.errors[0]}</SizableText>
                            )}
                          </XStack>
                        );
                      })}
                    </YStack>
                  </YStack>
                )}
              </div>
            );
          })}
        </YStack>

        {/* Aggregated Results Table — multi-round only */}
        {benchmarkComplete && roundHistory.length > 1 && aggregatedResults.length > 0 && (
          <YStack marginTop="$6">
            <XStack alignItems="center" gap="$3" marginBottom="$3">
              <YStack height={1} flex={1} backgroundColor="$borderColor" />
              <H2 fontSize="$3" fontWeight="500" color="$color11">
                Aggregated Results ({roundHistory.length} Rounds)
              </H2>
              <YStack height={1} flex={1} backgroundColor="$borderColor" />
            </XStack>
            <YStack backgroundColor="$background" borderWidth={1} borderRadius="$5" overflow="hidden">
              <SizableText width="100%" fontSize="$3" display="flex" flexDirection="column">
                <thead>
                  <YStack borderBottomWidth={1} backgroundColor="$color3">
                    <SizableText textAlign="left" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Test</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Pass Rate</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Avg Time</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Min/Max</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Avg Cost</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Avg Tokens</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Avg Tools</SizableText>
                    <SizableText textAlign="right" paddingHorizontal="$4" paddingVertical="$2" fontWeight="500" color="$color11">Assert %</SizableText>
                  </YStack>
                </thead>
                <tbody>
                  {aggregatedResults.map(r => (
                    <YStack key={r.id} borderBottomWidth={1} className="last-flat">
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" fontWeight="500">{r.name}</SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" fontWeight="500" color={r.passRate === 100 ? "$green10" : r.passRate > 0 ? "$yellow10" : "$red10"}>
                        {r.passRate.toFixed(0)}%
                        <SizableText fontSize="$1" fontWeight="400" color="$color11" marginLeft="$1">
                          ({r.passCount}/{r.roundCount})
                        </SizableText>
                      </SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" color="$color11">
                        {(r.avgTime / 1000).toFixed(1)}s
                      </SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" color="$color11" fontSize="$1">
                        {(r.minTime / 1000).toFixed(1)}s / {(r.maxTime / 1000).toFixed(1)}s
                      </SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" color="$color11">
                        {formatCost(r.avgCost)}
                      </SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" color="$color11">
                        {Math.round(r.avgTokens).toLocaleString()}
                      </SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" color="$color11">
                        {r.avgToolCalls.toFixed(1)}
                      </SizableText>
                      <SizableText paddingHorizontal="$4" paddingVertical="$2" textAlign="right" {...{ color: r.avgAssertionScore !== undefined ? r.avgAssertionScore === 100 ? '#22c55e' : r.avgAssertionScore > 0 ? '#eab308' : '#ef4444' : '$color11' }}>
                        {r.avgAssertionScore !== undefined ? `${r.avgAssertionScore.toFixed(0)}%` : '-'}
                      </SizableText>
                    </YStack>
                  ))}
                </tbody>
              </SizableText>
            </YStack>
          </YStack>
        )}
        </YStack>
      </YStack>
    </YStack>
  );
}
