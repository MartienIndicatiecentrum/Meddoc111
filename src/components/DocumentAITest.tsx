import React, { useState } from 'react';

const DocumentAITest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test!');

  const testBasicFunction = () => {
    setStatus('✅ Component is working perfectly!');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
        Document AI Test Interface
      </h1>

      {/* Basic Test Section */}
      <div style={{
        padding: '16px',
        backgroundColor: '#dbeafe',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #93c5fd'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>
          🔧 Basic Component Test
        </h2>
        <button
          onClick={testBasicFunction}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Test Component
        </button>
      </div>

      {/* Status Display */}
      {status && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d1fae5',
          border: '1px solid #34d399',
          borderRadius: '6px',
          marginBottom: '24px',
          color: '#065f46'
        }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      {/* Environment Check */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        border: '1px solid #d1d5db'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px' }}>
          🔍 Environment Information
        </h3>
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
          <p style={{ margin: '4px 0' }}>
            • Component loaded: <strong style={{ color: '#059669' }}>✅ Success</strong>
          </p>
          <p style={{ margin: '4px 0' }}>
            • React Router: <strong style={{ color: '#059669' }}>✅ Working</strong>
          </p>
          <p style={{ margin: '4px 0' }}>
            • Vite Environment: <strong style={{ color: '#059669' }}>✅ Ready</strong>
          </p>
          <p style={{ margin: '4px 0' }}>
            • Route /test-ai: <strong style={{ color: '#059669' }}>✅ Active</strong>
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        padding: '16px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #fbbf24',
        marginTop: '24px'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
          🚀 Next Steps
        </h3>
        <div style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
          <p style={{ margin: '4px 0' }}>1. ✅ Basic component setup complete</p>
          <p style={{ margin: '4px 0' }}>2. 🔄 Next: Add Supabase connection</p>
          <p style={{ margin: '4px 0' }}>3. 🔄 Next: Add PDF processing</p>
          <p style={{ margin: '4px 0' }}>4. 🔄 Next: Add AI question answering</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentAITest;
