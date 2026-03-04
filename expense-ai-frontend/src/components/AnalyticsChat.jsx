import React, { useState } from 'react';
import { Input, Button, Card, Spin, message } from 'antd';
import { SendOutlined, FileExcelOutlined } from '@ant-design/icons';
import { analyticsAPI } from '../services/api';
import ChartRenderer from './ChartRenderer';
import ExportModal from './ExportModal';

const AnalyticsChat = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleAnalyze = async () => {
    if (!query.trim()) {
      message.warning('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const response = await analyticsAPI.analyzeExpenses(query, {});
      
      const newMessage = {
        id: response.data.query_id,
        query: query,
        response: response.data,
        timestamp: new Date(),
      };

      setChatHistory([...chatHistory, newMessage]);
      setCurrentAnalysis(newMessage);
      setQuery('');
      
    } catch (error) {
      message.error('Analysis failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!currentAnalysis) {
      message.warning('No analysis to export');
      return;
    }
    setShowExportModal(true);
  };

  return (
    <div className="analytics-chat">
      <Card title="AI Analytics Workspace" style={{ minHeight: '600px' }}>
        {/* Chat History */}
        <div className="chat-messages" style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          marginBottom: '20px' 
        }}>
          {chatHistory.map((msg) => (
            <div key={msg.id} className="chat-message" style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                You: {msg.query}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Summary:</strong> {msg.response.summary}
              </div>
              
              {msg.response.insights && msg.response.insights.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Insights:</strong>
                  <ul>
                    {msg.response.insights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {msg.response.statistics && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Statistics:</strong>
                  <div>Total: ₱{msg.response.statistics.total?.toLocaleString()}</div>
                  <div>Average: ₱{msg.response.statistics.average?.toLocaleString()}</div>
                  <div>Records: {msg.response.record_count}</div>
                </div>
              )}
              
              {msg.response.chart_config && (
                <ChartRenderer config={msg.response.chart_config} />
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Input.TextArea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask ExpenseAI... (e.g., 'Show me utilities expenses this quarter')"
            rows={2}
            onPressEnter={(e) => {
              if (e.shiftKey) return;
              e.preventDefault();
              handleAnalyze();
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAnalyze}
              loading={loading}
            >
              Analyze
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExport}
              disabled={!currentAnalysis}
            >
              Export
            </Button>
          </div>
        </div>
      </Card>

      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        analysis={currentAnalysis}
      />
    </div>
  );
};

export default AnalyticsChat;