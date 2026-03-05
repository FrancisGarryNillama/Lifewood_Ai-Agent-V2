import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: '#080C14',
  surface: '#0D1420',
  surfaceHigh: '#111B2E',
  surfaceTop: '#162035',
  border: '#1E2D47',
  borderGlow: '#2A4070',
  accent: '#2563EB',
  accentBright: '#3B82F6',
  accentGlow: 'rgba(37,99,235,0.15)',
  green: '#10B981',
  greenGlow: 'rgba(16,185,129,0.12)',
  amber: '#F59E0B',
  red: '#EF4444',
  cyan: '#06B6D4',
  text: '#E2E8F0',
  textMid: '#94A3B8',
  textDim: '#475569',
};

const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

// ─── MOCK DATA (replace with real API calls) ─────────────────────────────────
const MOCK_SESSIONS = [
  { id: '1', title: 'Q1 Expense Review', message_count: 12, updated_at: '2026-03-04T08:00:00Z' },
  { id: '2', title: 'Utilities Analysis', message_count: 5, updated_at: '2026-03-03T14:30:00Z' },
];

const MOCK_RECEIPTS = [
  { id: 1, vendor_name: 'Meralco', total_amount: 12500, category: 'Utilities', transaction_date: '2026-03-01', confidence_score: 0.94 },
  { id: 2, vendor_name: 'Jollibee', total_amount: 2340, category: 'Food', transaction_date: '2026-03-02', confidence_score: 0.88 },
  { id: 3, vendor_name: 'SM Office Depot', total_amount: 8750, category: 'Office Supplies', transaction_date: '2026-03-03', confidence_score: 0.91 },
  { id: 4, vendor_name: 'Grab', total_amount: 1200, category: 'Transportation', transaction_date: '2026-03-03', confidence_score: 0.96 },
  { id: 5, vendor_name: 'PLDT', total_amount: 3500, category: 'Utilities', transaction_date: '2026-03-04', confidence_score: 0.89 },
];

const MOCK_GOV_LOGS = [
  { id: 1, action_type: 'TOOL_CALL', status: 'APPROVED', tool_name: 'ReceiptVisionTool', confidence_score: 0.94, created_at: '2026-03-04T09:01:00Z', rejection_reason: null },
  { id: 2, action_type: 'TOOL_CALL', status: 'APPROVED', tool_name: 'ReceiptStoreTool', confidence_score: 0.94, created_at: '2026-03-04T09:01:05Z', rejection_reason: null },
  { id: 3, action_type: 'TOOL_CALL', status: 'FLAGGED', tool_name: 'ReceiptVisionTool', confidence_score: 0.58, created_at: '2026-03-04T08:45:00Z', rejection_reason: 'Confidence score 0.58 below threshold 0.65' },
  { id: 4, action_type: 'ANALYTICS', status: 'APPROVED', tool_name: 'AnalyticsTool', confidence_score: 0.91, created_at: '2026-03-04T08:30:00Z', rejection_reason: null },
  { id: 5, action_type: 'EXPORT', status: 'APPROVED', tool_name: 'ExcelExecutiveReportTool', confidence_score: null, created_at: '2026-03-04T08:31:00Z', rejection_reason: null },
];

const MOCK_AGENT_CONVO = [
  {
    id: 1, role: 'agent', content: "Hello! I'm the **ExpenseAI Intelligence Agent**. I can help you extract receipts, analyze expenses, generate reports, and query your financial data.\n\nTry: *\"Show me this month's spending by category\"* or upload a receipt image.",
    tools_used: [], confidence_score: 1.0, agent_state: 'IDLE',
    reasoning_trace: []
  }
];

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
    background: color === 'green' ? C.greenGlow : color === 'red' ? 'rgba(239,68,68,0.12)' : color === 'amber' ? 'rgba(245,158,11,0.12)' : C.accentGlow,
    color: color === 'green' ? C.green : color === 'red' ? C.red : color === 'amber' ? C.amber : C.accentBright,
    border: `1px solid ${color === 'green' ? 'rgba(16,185,129,0.25)' : color === 'red' ? 'rgba(239,68,68,0.25)' : color === 'amber' ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.25)'}`,
    letterSpacing: '0.02em',
  }}>{children}</span>
);

const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: C.surfaceHigh, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '20px 24px', flex: 1,
    borderLeft: `3px solid ${color || C.accent}`,
  }}>
    <div style={{ color: C.textDim, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <div style={{ color: C.text, fontSize: 26, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{value}</div>
    {sub && <div style={{ color: C.textMid, fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </div>
);

const ConfidenceBar = ({ score }) => {
  const color = score >= 0.85 ? C.green : score >= 0.65 ? C.amber : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", minWidth: 36 }}>
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
};

// ─── TOOL BADGE COMPONENT ────────────────────────────────────────────────────
const ToolBadge = ({ name }) => {
  const colors = {
    ReceiptVisionTool: C.cyan,
    ReceiptStoreTool: C.green,
    ReceiptQueryTool: C.accentBright,
    AnalyticsTool: '#8B5CF6',
    ExcelExecutiveReportTool: C.green,
    MemoryTool: C.amber,
  };
  const icons = {
    ReceiptVisionTool: '👁', ReceiptStoreTool: '💾', ReceiptQueryTool: '🔍',
    AnalyticsTool: '📊', ExcelExecutiveReportTool: '📋', MemoryTool: '🧠',
  };
  const color = colors[name] || C.textMid;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
      background: `${color}15`, color, border: `1px solid ${color}30`,
      margin: '2px',
    }}>
      {icons[name]} {name}
    </span>
  );
};

// ─── REASONING TRACE PANEL ───────────────────────────────────────────────────
const ReasoningTrace = ({ trace }) => {
  const [open, setOpen] = useState(false);
  if (!trace || trace.length === 0) return null;
  const stateColors = {
    INTENT_CLASSIFICATION: C.cyan, TOOL_SELECTION: C.accentBright,
    TOOL_EXECUTION: C.amber, OUTPUT_VALIDATION: '#8B5CF6',
    MEMORY_UPDATE: C.green, RESPONSE: C.green, ERROR: C.red,
  };
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        background: 'none', border: `1px solid ${C.border}`, color: C.textMid,
        padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🧠 {open ? 'Hide' : 'Show'} Reasoning Trace ({trace.length} steps)
      </button>
      {open && (
        <div style={{ marginTop: 8, borderLeft: `2px solid ${C.border}`, paddingLeft: 12 }}>
          {trace.map((step, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: stateColors[step.state] || C.textDim,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: C.bg, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ color: stateColors[step.state] || C.textMid, fontSize: 11, fontWeight: 600 }}>
                  {step.state}
                </span>
                {step.confidence && (
                  <span style={{ color: C.textDim, fontSize: 10 }}>
                    conf: {(step.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div style={{ color: C.textMid, fontSize: 12, paddingLeft: 28, lineHeight: 1.5 }}>
                {step.reasoning}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CHART RENDERER ───────────────────────────────────────────────────────────
const ChartRenderer = ({ config }) => {
  if (!config?.chart_type || !config.labels?.length) return null;
  const data = config.labels.map((label, i) => ({ name: label, value: config.values?.[i] || 0 }));
  const fmt = (v) => `₱${Number(v).toLocaleString()}`;

  return (
    <div style={{ marginTop: 16, padding: 16, background: C.surfaceHigh, borderRadius: 10, border: `1px solid ${C.border}` }}>
      {config.title && <div style={{ color: C.text, fontWeight: 600, marginBottom: 12, fontSize: 13 }}>{config.title}</div>}
      <ResponsiveContainer width="100%" height={220}>
        {config.chart_type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip formatter={fmt} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
          </PieChart>
        ) : config.chart_type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" stroke={C.textDim} tick={{ fontSize: 11 }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={fmt} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
            <Line type="monotone" dataKey="value" stroke={C.accentBright} strokeWidth={2} dot={{ fill: C.accentBright }} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" stroke={C.textDim} tick={{ fontSize: 11 }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={fmt} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
            <Bar dataKey="value" fill={C.accentBright} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  const chartConfig = msg.tool_outputs?.AnalyticsTool?.result?.chart_config;

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const italic = bold.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: italic || '&nbsp;' }} />;
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginRight: 10, marginTop: 2,
          background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>🤖</div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          padding: '12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          background: isUser ? `linear-gradient(135deg, ${C.accent}, #1D4ED8)` : C.surfaceHigh,
          border: isUser ? 'none' : `1px solid ${C.border}`,
          color: C.text, fontSize: 13, lineHeight: 1.65,
        }}>
          {renderContent(msg.content)}
        </div>

        {!isUser && msg.tools_used?.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {msg.tools_used.map(t => <ToolBadge key={t} name={t} />)}
          </div>
        )}

        {!isUser && msg.confidence_score != null && (
          <div style={{ marginTop: 8, width: 200 }}>
            <div style={{ color: C.textDim, fontSize: 10, marginBottom: 4 }}>CONFIDENCE</div>
            <ConfidenceBar score={msg.confidence_score} />
          </div>
        )}

        {chartConfig && <ChartRenderer config={chartConfig} />}
        {!isUser && <ReasoningTrace trace={msg.reasoning_trace} />}
      </div>

      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginLeft: 10, marginTop: 2,
          background: C.surfaceTop, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>👤</div>
      )}
    </div>
  );
};

// ─── AGENT PANEL (right sidebar) ────────────────────────────────────────────
const AgentPanel = ({ lastMsg, isThinking, agentState }) => {
  const stateFlow = ['IDLE', 'INTENT_CLASSIFICATION', 'TOOL_SELECTION', 'TOOL_EXECUTION', 'OUTPUT_VALIDATION', 'MEMORY_UPDATE', 'RESPONSE'];
  const currentIdx = stateFlow.indexOf(agentState || 'IDLE');

  return (
    <div style={{
      width: 280, background: C.surface, borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Agent Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isThinking ? C.amber : C.green,
            boxShadow: `0 0 6px ${isThinking ? C.amber : C.green}`,
            animation: isThinking ? 'pulse 1s infinite' : 'none',
          }} />
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
            {isThinking ? 'Processing...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* State Machine */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>State Machine</div>
        {stateFlow.map((state, i) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${i <= currentIdx ? C.accentBright : C.border}`,
              background: i === currentIdx ? C.accentBright : i < currentIdx ? `${C.accentBright}30` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              {i < currentIdx && <span style={{ fontSize: 10 }}>✓</span>}
            </div>
            <span style={{
              fontSize: 11, fontWeight: i === currentIdx ? 600 : 400,
              color: i === currentIdx ? C.text : i < currentIdx ? C.textMid : C.textDim,
            }}>{state}</span>
          </div>
        ))}
      </div>

      {/* Tool Activity */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flex: 1 }}>
        <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Tool Activity</div>
        {lastMsg?.tools_used?.length > 0 ? (
          lastMsg.tools_used.map(t => (
            <div key={t} style={{ marginBottom: 8 }}>
              <ToolBadge name={t} />
              {lastMsg.tool_outputs?.[t]?.validation && (
                <div style={{ marginTop: 3, paddingLeft: 4 }}>
                  <Badge color={lastMsg.tool_outputs[t].validation.status === 'APPROVED' ? 'green' : 'amber'}>
                    {lastMsg.tool_outputs[t].validation.status}
                  </Badge>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ color: C.textDim, fontSize: 12 }}>No tools active</div>
        )}
      </div>

      {/* Confidence */}
      {lastMsg?.confidence_score != null && (
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Confidence Score</div>
          <ConfidenceBar score={lastMsg.confidence_score} />
        </div>
      )}

      {/* Governance Badge */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Governance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMid }}>
            <span style={{ color: C.green }}>✓</span> Schema Validation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMid }}>
            <span style={{ color: C.green }}>✓</span> Role Permissions
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMid }}>
            <span style={{ color: C.green }}>✓</span> Data Scope Enforced
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMid }}>
            <span style={{ color: C.green }}>✓</span> Prompt Injection Guard
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── VIEWS ───────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const totalSpend = MOCK_RECEIPTS.reduce((s, r) => s + r.total_amount, 0);
  const avgConf = MOCK_RECEIPTS.reduce((s, r) => s + r.confidence_score, 0) / MOCK_RECEIPTS.length;

  const catData = MOCK_RECEIPTS.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.total_amount;
    return acc;
  }, {});
  const chartData = Object.entries(catData).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: C.textDim, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Overview</div>
        <h1 style={{ margin: 0, color: C.text, fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard label="Total Expenses" value={`₱${totalSpend.toLocaleString()}`} sub="This month" color={C.accent} />
        <StatCard label="Receipts Processed" value={MOCK_RECEIPTS.length} sub="AI extracted" color={C.green} />
        <StatCard label="Avg Confidence" value={`${(avgConf * 100).toFixed(0)}%`} sub="AI accuracy" color={C.amber} />
        <StatCard label="Governance Logs" value={MOCK_GOV_LOGS.length} sub="All actions audited" color={C.cyan} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Spending by Category */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ color: C.text, fontWeight: 600, marginBottom: 16 }}>Spending by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" stroke={C.textDim} tick={{ fontSize: 10 }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `₱${v.toLocaleString()}`} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Receipts */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ color: C.text, fontWeight: 600, marginBottom: 16 }}>Recent Receipts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_RECEIPTS.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{r.vendor_name}</div>
                  <div style={{ color: C.textDim, fontSize: 11 }}>{r.category} · {r.transaction_date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                    ₱{r.total_amount.toLocaleString()}
                  </div>
                  <ConfidenceBar score={r.confidence_score} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentWorkspace = ({ callAgent }) => {
  const [messages, setMessages] = useState(MOCK_AGENT_CONVO);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [agentState, setAgentState] = useState('IDLE');
  const [dragOver, setDragOver] = useState(false);
  const [sessions] = useState(MOCK_SESSIONS);
  const [activeSession] = useState(MOCK_SESSIONS[0]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastAgentMsg = [...messages].reverse().find(m => m.role === 'agent');

  const simulateAgentResponse = async (userMsg, hasImage = false) => {
    setIsThinking(true);
    setAgentState('INTENT_CLASSIFICATION');

    const states = ['TOOL_SELECTION', 'TOOL_EXECUTION', 'OUTPUT_VALIDATION', 'MEMORY_UPDATE', 'RESPONSE'];
    for (const state of states) {
      await new Promise(r => setTimeout(r, 600));
      setAgentState(state);
    }

    const lower = userMsg.toLowerCase();
    let response, tools_used = [], tool_outputs = {}, confidence = 0.91;
    let chartConfig = null;

    if (hasImage || lower.includes('receipt') || lower.includes('upload')) {
      tools_used = ['ReceiptVisionTool', 'ReceiptStoreTool'];
      confidence = 0.88;
      response = "Receipt processed successfully!\n\n**Extracted Data:**\n- Vendor: Meralco Corporation\n- Total Amount: ₱12,500.00\n- VAT: ₱1,607.14\n- Date: 2026-03-04\n- Category: Utilities\n\nConfidence score: 88%. Receipt stored with ID #1024. Governance validation: APPROVED.";
    } else if (lower.includes('analyt') || lower.includes('categor') || lower.includes('spend') || lower.includes('show')) {
      tools_used = ['ReceiptQueryTool', 'AnalyticsTool'];
      confidence = 0.94;
      chartConfig = { chart_type: 'bar', labels: ['Utilities', 'Food', 'Office Supplies', 'Transportation'], values: [16000, 2340, 8750, 1200], title: 'Spending by Category' };
      response = "Here's your expense analysis:\n\n**Total Spend:** ₱28,290\n**Top Category:** Utilities (₱16,000 — 56.6%)\n\n**Key Insights:**\n- Utilities is the dominant expense driver this month\n- Office Supplies costs are elevated vs prior period\n- Transportation remains within expected range\n\n**Recommendation:** Review Utilities contracts — PLDT + Meralco combined account for over half of total spend.";
    } else if (lower.includes('export') || lower.includes('report') || lower.includes('excel')) {
      tools_used = ['ReceiptQueryTool', 'AnalyticsTool', 'ExcelExecutiveReportTool'];
      confidence = 0.96;
      response = "Executive report generated successfully!\n\n**Report includes:**\n- Executive Summary with KPIs\n- Detailed Transaction Sheet\n- Category Pivot Analysis\n- Embedded Charts\n- Audit Metadata\n\n📊 File: `expenseai_report_20260304.xlsx`\nDownload initiated. Export logged in Governance Logs.";
    } else {
      tools_used = ['MemoryTool'];
      confidence = 0.85;
      response = "I understand you're asking about your expenses. I can help you:\n\n- **Upload & extract** receipts with AI vision\n- **Analyze** spending by category, vendor, or date range\n- **Generate** Excel executive reports\n- **Query** your expense database\n\nTry: *\"Show me utilities spending this month\"* or *\"Generate an executive report for Q1\"*";
    }

    const agentMsg = {
      id: Date.now(),
      role: 'agent',
      content: response,
      tools_used,
      tool_outputs: Object.fromEntries(
        tools_used.map(t => [t, {
          validation: { status: 'APPROVED', valid: true, issues: [] },
          result: t === 'AnalyticsTool' ? { chart_config: chartConfig, summary: response } : {}
        }])
      ),
      confidence_score: confidence,
      agent_state: 'RESPONSE',
      reasoning_trace: [
        { iteration: 1, state: 'INTENT_CLASSIFICATION', reasoning: `User input classified as: ${hasImage ? 'receipt_upload' : lower.includes('analyt') ? 'analytics_query' : 'general_query'}`, confidence: 0.95 },
        { iteration: 2, state: 'TOOL_SELECTION', reasoning: `Selected tools: ${tools_used.join(', ')} based on intent classification`, confidence: 0.92 },
        { iteration: 3, state: 'TOOL_EXECUTION', reasoning: 'All tools executed successfully within governance boundaries', confidence },
        { iteration: 4, state: 'OUTPUT_VALIDATION', reasoning: 'Schema validation passed. Confidence threshold check: PASSED. Role permissions: VERIFIED.', confidence },
        { iteration: 5, state: 'RESPONSE', reasoning: 'Composing structured response for user', confidence },
      ],
    };

    setMessages(prev => [...prev, agentMsg]);
    setIsThinking(false);
    setAgentState('IDLE');
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: input, tools_used: [], reasoning_trace: [] };
    setMessages(prev => [...prev, userMsg]);
    const q = input;
    setInput('');
    await simulateAgentResponse(q);
  };

  const handleFileUpload = async (file) => {
    const userMsg = { id: Date.now(), role: 'user', content: `📎 Uploaded: ${file.name}`, tools_used: [], reasoning_trace: [] };
    setMessages(prev => [...prev, userMsg]);
    await simulateAgentResponse(`Receipt image uploaded: ${file.name}`, true);
  };

  const quickPrompts = [
    "Show spending by category this month",
    "Compare Q1 vs Q2 utilities",
    "Generate executive report",
    "Find highest expense vendor",
  ];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Session Sidebar */}
      <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <button style={{
            width: '100%', padding: '8px 12px', background: C.accentGlow,
            border: `1px solid ${C.accentBright}40`, borderRadius: 8,
            color: C.accentBright, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>+ New Session</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sessions.map(s => (
            <div key={s.id} style={{
              padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
              background: s.id === activeSession?.id ? C.surfaceHigh : 'transparent',
              border: s.id === activeSession?.id ? `1px solid ${C.border}` : '1px solid transparent',
            }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              <div style={{ color: C.textDim, fontSize: 10 }}>{s.message_count} messages</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>ExpenseAI Intelligence Agent</div>
            <div style={{ color: C.textDim, fontSize: 11 }}>Governed Financial Operations Agent · {activeSession?.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge color="green">● Active</Badge>
            <Badge color="blue">Governed</Badge>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '24px', background: dragOver ? `${C.accent}08` : 'transparent' }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {isThinking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div style={{ padding: '10px 16px', background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: '4px 16px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMid, fontSize: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, animation: 'bounce 1s infinite' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, animation: 'bounce 1s infinite 0.2s' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, animation: 'bounce 1s infinite 0.4s' }} />
                  <span style={{ marginLeft: 4 }}>Agent reasoning · {agentState}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickPrompts.map(p => (
            <button key={p} onClick={() => { setInput(p); }}
              style={{ padding: '4px 10px', background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMid, fontSize: 11, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px' }}>
            <button onClick={() => fileInputRef.current?.click()} style={{
              padding: '6px 10px', background: C.surfaceTop, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.textMid, cursor: 'pointer', fontSize: 16, flexShrink: 0,
            }} title="Upload receipt">📎</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask the agent... (Shift+Enter for newline)"
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: C.text,
                fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5,
                fontFamily: 'inherit', maxHeight: 100,
              }}
            />
            <button onClick={handleSend} disabled={isThinking || !input.trim()} style={{
              padding: '8px 16px', background: input.trim() && !isThinking ? C.accent : C.surfaceTop,
              border: 'none', borderRadius: 8, color: input.trim() && !isThinking ? 'white' : C.textDim,
              cursor: input.trim() && !isThinking ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, flexShrink: 0,
              transition: 'all 0.2s ease',
            }}>Send →</button>
          </div>
          <div style={{ color: C.textDim, fontSize: 10, marginTop: 6, textAlign: 'center' }}>
            Drop receipt images here · All actions governed & audited
          </div>
        </div>
      </div>

      {/* Agent Panel */}
      <AgentPanel lastMsg={lastAgentMsg} isThinking={isThinking} agentState={agentState} />
    </div>
  );
};

const ReceiptsView = () => (
  <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: C.textDim, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Data</div>
      <h1 style={{ margin: 0, color: C.text, fontSize: 28, fontWeight: 700 }}>Receipts</h1>
    </div>
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.surfaceHigh }}>
            {['ID', 'Vendor', 'Amount', 'Category', 'Date', 'Confidence', 'Status'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: C.textDim, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_RECEIPTS.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : `${C.surfaceHigh}50` }}>
              <td style={{ padding: '12px 16px', color: C.textDim, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>#{r.id}</td>
              <td style={{ padding: '12px 16px', color: C.text, fontSize: 13, fontWeight: 500 }}>{r.vendor_name}</td>
              <td style={{ padding: '12px 16px', color: C.text, fontSize: 13, fontFamily: "'DM Mono', monospace', fontWeight: 600" }}>₱{r.total_amount.toLocaleString()}</td>
              <td style={{ padding: '12px 16px' }}><Badge color="blue">{r.category}</Badge></td>
              <td style={{ padding: '12px 16px', color: C.textMid, fontSize: 12 }}>{r.transaction_date}</td>
              <td style={{ padding: '12px 16px', width: 120 }}><ConfidenceBar score={r.confidence_score} /></td>
              <td style={{ padding: '12px 16px' }}><Badge color="green">Stored</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const GovernanceView = () => {
  const summary = { total: 5, approved: 3, rejected: 0, flagged: 2 };

  const statusColor = (s) => s === 'APPROVED' ? 'green' : s === 'REJECTED' ? 'red' : 'amber';

  return (
    <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: C.textDim, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Security</div>
        <h1 style={{ margin: 0, color: C.text, fontSize: 28, fontWeight: 700 }}>Governance Logs</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total Actions" value={summary.total} color={C.accent} />
        <StatCard label="Approved" value={summary.approved} color={C.green} />
        <StatCard label="Flagged" value={summary.flagged} color={C.amber} />
        <StatCard label="Rejected" value={summary.rejected} color={C.red} />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.surfaceHigh }}>
              {['Action', 'Tool', 'Status', 'Confidence', 'Timestamp', 'Details'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: C.textDim, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_GOV_LOGS.map((log, i) => (
              <tr key={log.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : `${C.surfaceHigh}50` }}>
                <td style={{ padding: '12px 16px' }}><Badge color="blue">{log.action_type}</Badge></td>
                <td style={{ padding: '12px 16px' }}>{log.tool_name ? <ToolBadge name={log.tool_name} /> : <span style={{ color: C.textDim }}>—</span>}</td>
                <td style={{ padding: '12px 16px' }}><Badge color={statusColor(log.status)}>{log.status}</Badge></td>
                <td style={{ padding: '12px 16px', width: 120 }}>
                  {log.confidence_score ? <ConfidenceBar score={log.confidence_score} /> : <span style={{ color: C.textDim, fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px', color: C.textMid, fontSize: 11 }}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </td>
                <td style={{ padding: '12px 16px', color: C.textDim, fontSize: 11, maxWidth: 200 }}>
                  {log.rejection_reason || <span style={{ color: C.green }}>All checks passed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AgentActivityLog = () => {
  const activities = [
    { time: '09:01:05', state: 'RESPONSE', tool: 'ReceiptStoreTool', msg: 'Receipt #1024 stored successfully', ok: true },
    { time: '09:01:00', state: 'TOOL_EXECUTION', tool: 'ReceiptVisionTool', msg: 'Vision extraction complete — conf: 94%', ok: true },
    { time: '09:00:55', state: 'TOOL_SELECTION', tool: null, msg: 'Intent: receipt_upload. Selected: ReceiptVisionTool → ReceiptStoreTool', ok: true },
    { time: '09:00:50', state: 'INTENT_CLASSIFICATION', tool: null, msg: 'User input classified as receipt_upload', ok: true },
    { time: '08:31:00', state: 'RESPONSE', tool: 'ExcelExecutiveReportTool', msg: 'Excel report generated: expenseai_report_20260304.xlsx', ok: true },
    { time: '08:30:00', state: 'TOOL_EXECUTION', tool: 'AnalyticsTool', msg: 'Analytics complete — 5 records analyzed', ok: true },
    { time: '08:45:05', state: 'OUTPUT_VALIDATION', tool: 'ReceiptVisionTool', msg: 'FLAGGED: Confidence 0.58 below threshold 0.65', ok: false },
  ];

  const stateColor = (s) => ({ RESPONSE: C.green, TOOL_EXECUTION: C.amber, TOOL_SELECTION: C.accentBright, INTENT_CLASSIFICATION: C.cyan, OUTPUT_VALIDATION: '#8B5CF6' }[s] || C.textDim);

  return (
    <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: C.textDim, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Monitoring</div>
        <h1 style={{ margin: 0, color: C.text, fontSize: 28, fontWeight: 700 }}>Agent Activity Log</h1>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceHigh, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
          <span style={{ color: C.textMid, fontSize: 12 }}>Live Agent Activity Stream</span>
        </div>
        <div style={{ padding: '8px 0', fontFamily: "'DM Mono', monospace" }}>
          {activities.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '10px 20px', borderBottom: `1px solid ${C.border}20` }}>
              <span style={{ color: C.textDim, fontSize: 11, flexShrink: 0, minWidth: 60 }}>{a.time}</span>
              <span style={{ color: stateColor(a.state), fontSize: 11, fontWeight: 600, minWidth: 180, flexShrink: 0 }}>{a.state}</span>
              {a.tool && <span style={{ fontSize: 11, color: C.cyan, minWidth: 170, flexShrink: 0 }}>{a.tool}</span>}
              {!a.tool && <span style={{ minWidth: 170, flexShrink: 0 }} />}
              <span style={{ fontSize: 11, color: a.ok ? C.textMid : C.amber }}>{a.msg}</span>
              <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                {a.ok ? <span style={{ color: C.green, fontSize: 11 }}>✓</span> : <span style={{ color: C.amber, fontSize: 11 }}>⚠</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── NAV ITEM ────────────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '10px 16px', background: active ? C.accentGlow : 'transparent',
    border: active ? `1px solid ${C.accentBright}30` : '1px solid transparent',
    borderRadius: 8, color: active ? C.accentBright : C.textMid,
    cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
    textAlign: 'left', transition: 'all 0.15s ease', marginBottom: 2,
  }}>
    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge && <span style={{ background: C.red, color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
  </button>
);

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('agent');

  const navItems = [
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'agent', icon: '🤖', label: 'AI Agent', badge: null },
    { id: 'receipts', icon: '🧾', label: 'Receipts' },
    { id: 'governance', icon: '🛡', label: 'Governance Logs', badge: '2' },
    { id: 'activity', icon: '⚡', label: 'Agent Activity' },
  ];

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'agent': return <AgentWorkspace />;
      case 'receipts': return <ReceiptsView />;
      case 'governance': return <GovernanceView />;
      case 'activity': return <AgentActivityLog />;
      default: return <AgentWorkspace />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: 'IBM Plex Sans', sans-serif; color: ${C.text}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        textarea::placeholder { color: ${C.textDim}; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        button:hover { opacity: 0.9; }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: C.bg }}>
        {/* Top Bar */}
        <div style={{
          height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>ExpenseAI</span>
            <span style={{ color: C.textDim, fontSize: 12 }}>Intelligence Agent</span>
          </div>
          <div style={{ flex: 1 }} />
          <Badge color="green">● System Online</Badge>
          <Badge color="blue">Governance Active</Badge>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.surfaceTop, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>👤</div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '20px 12px', flex: 1 }}>
              <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>Navigation</div>
              {navItems.map(item => (
                <NavItem key={item.id} icon={item.icon} label={item.label} badge={item.badge} active={view === item.id} onClick={() => setView(item.id)} />
              ))}
            </div>

            {/* Memory Panel */}
            <div style={{ padding: '16px', borderTop: `1px solid ${C.border}` }}>
              <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Agent Memory</div>
              <div style={{ fontSize: 11, color: C.textMid, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Queries</span><span style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}>47</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Uploads</span><span style={{ color: C.text, fontFamily: "'DM Mono', monospace" }}>12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Top vendor</span><span style={{ color: C.cyan, fontSize: 10 }}>Meralco</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pref. chart</span><span style={{ color: C.cyan, fontSize: 10 }}>Bar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {renderView()}
          </div>
        </div>
      </div>
    </>
  );
}