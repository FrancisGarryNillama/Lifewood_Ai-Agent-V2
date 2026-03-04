import React, { useState } from 'react';
import { Modal, Checkbox, Button, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { analyticsAPI } from '../services/api';

const ExportModal = ({ visible, onClose, analysis }) => {
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState({
    include_summary: true,
    include_raw_data: true,
    include_pivot: false,
    include_charts: true,
    include_metadata: true,
  });

  const handleExport = async () => {
    if (!analysis) return;

    setExporting(true);
    try {
      const response = await analyticsAPI.exportToExcel(analysis.id, options);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Report exported successfully!');
      onClose();
      
    } catch (error) {
      message.error('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      title="Export Configuration"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<FileExcelOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          Generate Report
        </Button>,
      ]}
    >
      <div style={{ padding: '20px 0' }}>
        <h4>Select report components:</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Checkbox
            checked={options.include_summary}
            onChange={(e) => setOptions({ ...options, include_summary: e.target.checked })}
          >
            Executive Summary
          </Checkbox>
          <Checkbox
            checked={options.include_raw_data}
            onChange={(e) => setOptions({ ...options, include_raw_data: e.target.checked })}
          >
            Detailed Transactions
          </Checkbox>
          <Checkbox
            checked={options.include_pivot}
            onChange={(e) => setOptions({ ...options, include_pivot: e.target.checked })}
          >
            Pivot Tables
          </Checkbox>
          <Checkbox
            checked={options.include_charts}
            onChange={(e) => setOptions({ ...options, include_charts: e.target.checked })}
          >
            Embedded Charts
          </Checkbox>
          <Checkbox
            checked={options.include_metadata}
            onChange={(e) => setOptions({ ...options, include_metadata: e.target.checked })}
          >
            Audit Metadata
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;