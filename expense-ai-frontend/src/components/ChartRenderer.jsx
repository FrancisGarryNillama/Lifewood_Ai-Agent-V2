import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#1F4788', '#5B9BD5', '#70AD47', '#FFC000', '#C00000'];

const ChartRenderer = ({ config }) => {
  if (!config || !config.chart_type) return null;

  const data = config.labels?.map((label, idx) => ({
    name: label,
    value: config.values?.[idx] || 0,
  })) || [];

  const renderChart = () => {
    switch (config.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="value" fill="#5B9BD5" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#70AD47" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chart-container" style={{ marginTop: '20px' }}>
      {config.title && (
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
          {config.title}
        </h3>
      )}
      {renderChart()}
    </div>
  );
};

export default ChartRenderer;