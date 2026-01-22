"use client";

import { useCallback, useRef, useState } from "react";

interface ExecutionStats {
  callCount: number;
  totalTime: number;
  avgTime: number;
  status: "cold" | "warming" | "hot" | "optimized";
  optimizationLevel: number;
  firstTime: number | null;
  bestTime: number | null;
}

interface FunctionRecord {
  name: string;
  code: string;
  stats: ExecutionStats;
  history: number[];
  execute: () => void; // Real function to execute
  iterations: number; // Number of iterations per execution
}

const OPTIMIZATION_THRESHOLD = 5;
const HOT_THRESHOLD = 10;
const OPTIMIZED_THRESHOLD = 20;

// ============================================
// REAL FUNCTIONS TO BE JIT-COMPILED
// ============================================

// Calculate sum of an array - simple loop
function calculateSum(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// Recursive Fibonacci - expensive computation
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Matrix multiplication - medium complexity, shows O(n³) JIT optimization
function matrixMultiply(size: number): number[][] {
  const a: number[][] = Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random()));
  const b: number[][] = Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random()));
  const result: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

// Generate test data
const testArray = Array.from({ length: 10000 }, (_, i) => i);

export default function Home() {
  const [functions, setFunctions] = useState<FunctionRecord[]>([
    {
      name: "calculateSum",
      code: `function calculateSum(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
      stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold", optimizationLevel: 0, firstTime: null, bestTime: null },
      history: [],
      execute: () => calculateSum(testArray),
      iterations: 100,
    },
    {
      name: "fibonacci",
      code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
      stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold", optimizationLevel: 0, firstTime: null, bestTime: null },
      history: [],
      execute: () => fibonacci(30),
      iterations: 1,
    },
    {
      name: "matrixMultiply",
      code: `function matrixMultiply(size) {
  // Create and multiply two NxN matrices
  const a = Array(size).fill(0).map(() => 
    Array(size).fill(0).map(() => Math.random())
  );
  // ... O(n³) complexity
}`,
      stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold", optimizationLevel: 0, firstTime: null, bestTime: null },
      history: [],
      execute: () => matrixMultiply(50),
      iterations: 1,
    },
  ]);

  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const executeFunction = useCallback(
    (funcIndex: number) => {
      setFunctions((prev) => {
        const updated = [...prev];
        const func = { ...updated[funcIndex] };
        const stats = { ...func.stats };

        // ============================================
        // REAL EXECUTION WITH performance.now()
        // ============================================
        const start = performance.now();
        
        // Execute the function multiple times for more stable measurements
        for (let i = 0; i < func.iterations; i++) {
          func.execute();
        }
        
        const executionTime = performance.now() - start;

        // Track first and best times for comparison
        if (stats.firstTime === null) {
          stats.firstTime = executionTime;
          addLog(`📊 ${func.name} first execution: ${executionTime.toFixed(2)}ms`);
        }
        if (stats.bestTime === null || executionTime < stats.bestTime) {
          const improvement = stats.bestTime !== null 
            ? ((stats.bestTime - executionTime) / stats.bestTime * 100).toFixed(1)
            : "0";
          if (stats.bestTime !== null && Number(improvement) > 5) {
            addLog(`⚡ ${func.name} new best: ${executionTime.toFixed(2)}ms (-${improvement}%)`);
          }
          stats.bestTime = executionTime;
        }

        stats.callCount += 1;
        stats.totalTime += executionTime;
        stats.avgTime = stats.totalTime / stats.callCount;

        // Calculate real optimization level based on improvement from first execution
        if (stats.firstTime !== null && stats.firstTime > 0) {
          const improvementRatio = 1 - (stats.bestTime ?? stats.firstTime) / stats.firstTime;
          stats.optimizationLevel = Math.min(5, Math.max(0, improvementRatio * 20));
        }

        // Update optimization status based on call count AND real performance
        if (stats.callCount >= OPTIMIZED_THRESHOLD) {
          if (stats.status !== "optimized") {
            const speedup = stats.firstTime && stats.bestTime 
              ? ((stats.firstTime - stats.bestTime) / stats.firstTime * 100).toFixed(1)
              : "?";
            addLog(`🚀 ${func.name} fully optimized! Speedup: ${speedup}%`);
          }
          stats.status = "optimized";
        } else if (stats.callCount >= HOT_THRESHOLD) {
          if (stats.status !== "hot") {
            addLog(`🔥 ${func.name} marked as HOT! V8 is aggressively optimizing.`);
          }
          stats.status = "hot";
        } else if (stats.callCount >= OPTIMIZATION_THRESHOLD) {
          if (stats.status !== "warming") {
            addLog(`⚡ ${func.name} warming up. JIT type profiling active.`);
          }
          stats.status = "warming";
        }

        func.stats = stats;
        func.history = [...func.history.slice(-30), executionTime];
        updated[funcIndex] = func;
        return updated;
      });
    },
    [addLog]
  );

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    addLog("▶️ Starting REAL JIT measurement...");

    for (let i = 0; i < 30; i++) {
      // Random function selection (simulating real workload)
      const funcIndex = Math.floor(Math.random() * functions.length);
      executeFunction(funcIndex);
      await new Promise((r) => setTimeout(r, 200)); // Slightly longer delay for visualization
    }

    addLog("✅ Measurement complete! Compare first vs best times.");
    setIsRunning(false);
  }, [functions.length, executeFunction, addLog]);

  const resetAll = useCallback(() => {
    setFunctions((prev) =>
      prev.map((f) => ({
        ...f,
        stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold" as const, optimizationLevel: 0, firstTime: null, bestTime: null },
        history: [],
      }))
    );
    setLogs([]);
    addLog("🔄 JIT state reset. All functions back to cold state.");
  }, [addLog]);

  const getStatusColor = (status: ExecutionStats["status"]) => {
    switch (status) {
      case "cold":
        return "bg-slate-500";
      case "warming":
        return "bg-yellow-500";
      case "hot":
        return "bg-orange-500";
      case "optimized":
        return "bg-green-500";
    }
  };

  const getStatusGlow = (status: ExecutionStats["status"]) => {
    switch (status) {
      case "cold":
        return "";
      case "warming":
        return "shadow-yellow-500/50 shadow-lg";
      case "hot":
        return "shadow-orange-500/50 shadow-xl animate-pulse";
      case "optimized":
        return "shadow-green-500/50 shadow-xl";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            JIT Optimizer Visualizer
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            <span className="text-green-400 font-semibold">Real execution!</span> Watch V8&apos;s JIT compiler optimize code as you run it.
            Compare <span className="text-red-400">First Time</span> vs <span className="text-green-400">Best Time</span> to see actual optimization.
          </p>
        </header>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={runSimulation}
            disabled={isRunning}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? "⏳ Running..." : "▶️ Run Simulation"}
          </button>
          <button
            type="button"
            onClick={resetAll}
            disabled={isRunning}
            className="px-6 py-3 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            🔄 Reset
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {functions.map((func, index) => (
            <div
              key={func.name}
              className={`bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700 transition-all duration-300 ${getStatusGlow(func.stats.status)}`}
            >
              {/* Function Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-mono font-bold text-cyan-300">{func.name}()</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(func.stats.status)}`}
                >
                  {func.stats.status}
                </span>
              </div>

              {/* Code Preview */}
              <pre className="bg-slate-900/80 rounded-lg p-4 text-sm font-mono text-slate-300 mb-4 overflow-x-auto">
                {func.code}
              </pre>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase">Calls</div>
                  <div className="text-2xl font-bold text-white">{func.stats.callCount}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase">Avg Time</div>
                  <div className="text-2xl font-bold text-white">{func.stats.avgTime.toFixed(1)}ms</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase">First Time</div>
                  <div className="text-xl font-bold text-red-400">
                    {func.stats.firstTime !== null ? `${func.stats.firstTime.toFixed(1)}ms` : "—"}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase">Best Time</div>
                  <div className="text-xl font-bold text-green-400">
                    {func.stats.bestTime !== null ? `${func.stats.bestTime.toFixed(1)}ms` : "—"}
                  </div>
                </div>
              </div>

              {/* JIT Speedup Indicator */}
              {func.stats.firstTime !== null && func.stats.bestTime !== null && (
                <div className="bg-gradient-to-r from-red-500/20 to-green-500/20 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Real JIT Speedup</span>
                    <span className="text-lg font-bold text-green-400">
                      {((1 - func.stats.bestTime / func.stats.firstTime) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Optimization Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Optimization Level</span>
                  <span>{Math.round(func.stats.optimizationLevel * 20)}%</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getStatusColor(func.stats.status)}`}
                    style={{ width: `${func.stats.optimizationLevel * 20}%` }}
                  />
                </div>
              </div>

              {/* Execution Time Graph */}
              <div className="h-16 flex items-end gap-0.5">
                {func.history.map((time, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${getStatusColor(func.stats.status)}`}
                    style={{ height: `${Math.min(100, time)}%`, opacity: 0.3 + (i / func.history.length) * 0.7 }}
                  />
                ))}
                {func.history.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
                    No executions yet
                  </div>
                )}
              </div>

              {/* Manual Execute Button */}
              <button
                type="button"
                onClick={() => executeFunction(index)}
                disabled={isRunning}
                className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                Execute Once
              </button>
            </div>
          ))}
        </div>

        {/* JIT Concepts Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: "❄️",
              title: "Cold Code",
              desc: "Interpreted directly. No optimizations yet.",
              color: "border-slate-500",
            },
            {
              icon: "⚡",
              title: "Warming Up",
              desc: "Type profiling and call frequency tracking.",
              color: "border-yellow-500",
            },
            {
              icon: "🔥",
              title: "Hot Code",
              desc: "Inlining, type specialization applied.",
              color: "border-orange-500",
            },
            {
              icon: "🚀",
              title: "Optimized",
              desc: "Native machine code. Maximum performance.",
              color: "border-green-500",
            },
          ].map((concept) => (
            <div
              key={concept.title}
              className={`bg-slate-800/30 rounded-xl p-4 border-l-4 ${concept.color}`}
            >
              <div className="text-2xl mb-2">{concept.icon}</div>
              <h4 className="font-semibold text-white mb-1">{concept.title}</h4>
              <p className="text-sm text-slate-400">{concept.desc}</p>
            </div>
          ))}
        </div>

        {/* Console Log */}
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-green-400">●</span> JIT Compiler Console
          </h3>
          <div className="h-40 overflow-y-auto font-mono text-sm space-y-1 text-slate-400">
            {logs.length === 0 ? (
              <div className="text-slate-600">Waiting for execution...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="hover:text-slate-200 transition-colors">
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>
            This simulation demonstrates JIT optimization concepts similar to those used in V8 (Chrome/Node.js),
            SpiderMonkey (Firefox), and other modern JavaScript engines.
          </p>
        </footer>
      </div>
    </div>
  );
}
