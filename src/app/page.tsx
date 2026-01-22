"use client";

import { useState, useCallback, useRef } from "react";

interface ExecutionStats {
  callCount: number;
  totalTime: number;
  avgTime: number;
  status: "cold" | "warming" | "hot" | "optimized";
  optimizationLevel: number;
}

interface FunctionRecord {
  name: string;
  code: string;
  stats: ExecutionStats;
  history: number[];
}

const OPTIMIZATION_THRESHOLD = 5;
const HOT_THRESHOLD = 10;
const OPTIMIZED_THRESHOLD = 20;

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
      stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold", optimizationLevel: 0 },
      history: [],
    },
    {
      name: "fibonacci",
      code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
      stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold", optimizationLevel: 0 },
      history: [],
    },
    {
      name: "multiply",
      code: `function multiply(a, b) {
  return a * b;
}`,
      stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold", optimizationLevel: 0 },
      history: [],
    },
  ]);

  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const simulateExecution = useCallback(
    (funcIndex: number) => {
      setFunctions((prev) => {
        const updated = [...prev];
        const func = { ...updated[funcIndex] };
        const stats = { ...func.stats };

        // Simulate execution time (decreases as optimization level increases)
        const baseTime = Math.random() * 100 + 50;
        const optimizationFactor = 1 - stats.optimizationLevel * 0.15;
        const executionTime = Math.max(5, baseTime * optimizationFactor);

        stats.callCount += 1;
        stats.totalTime += executionTime;
        stats.avgTime = stats.totalTime / stats.callCount;

        // Update optimization status based on call count
        if (stats.callCount >= OPTIMIZED_THRESHOLD) {
          if (stats.status !== "optimized") {
            addLog(`🚀 ${func.name} fully optimized! Native machine code generated.`);
          }
          stats.status = "optimized";
          stats.optimizationLevel = Math.min(5, stats.optimizationLevel + 0.5);
        } else if (stats.callCount >= HOT_THRESHOLD) {
          if (stats.status !== "hot") {
            addLog(`🔥 ${func.name} marked as HOT! Aggressive optimizations applied.`);
          }
          stats.status = "hot";
          stats.optimizationLevel = Math.min(4, stats.optimizationLevel + 0.3);
        } else if (stats.callCount >= OPTIMIZATION_THRESHOLD) {
          if (stats.status !== "warming") {
            addLog(`⚡ ${func.name} warming up. Type profiling started.`);
          }
          stats.status = "warming";
          stats.optimizationLevel = Math.min(2, stats.optimizationLevel + 0.2);
        }

        func.stats = stats;
        func.history = [...func.history.slice(-20), executionTime];
        updated[funcIndex] = func;
        return updated;
      });
    },
    [addLog]
  );

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    addLog("▶️ Starting JIT simulation...");

    for (let i = 0; i < 30; i++) {
      // Random function selection (simulating real workload)
      const funcIndex = Math.floor(Math.random() * functions.length);
      simulateExecution(funcIndex);
      await new Promise((r) => setTimeout(r, 150));
    }

    addLog("✅ Simulation complete!");
    setIsRunning(false);
  }, [functions.length, simulateExecution, addLog]);

  const resetAll = useCallback(() => {
    setFunctions((prev) =>
      prev.map((f) => ({
        ...f,
        stats: { callCount: 0, totalTime: 0, avgTime: 0, status: "cold" as const, optimizationLevel: 0 },
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
            Watch how Just-In-Time compilation detects hot spots and optimizes code in real-time.
            Functions transition from <span className="text-slate-300">cold</span> → 
            <span className="text-yellow-400"> warming</span> → 
            <span className="text-orange-400"> hot</span> → 
            <span className="text-green-400"> optimized</span> as they&apos;re called more frequently.
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase">Calls</div>
                  <div className="text-2xl font-bold text-white">{func.stats.callCount}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase">Avg Time</div>
                  <div className="text-2xl font-bold text-white">{func.stats.avgTime.toFixed(1)}ms</div>
                </div>
              </div>

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
                    key={time}
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
                onClick={() => simulateExecution(index)}
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
