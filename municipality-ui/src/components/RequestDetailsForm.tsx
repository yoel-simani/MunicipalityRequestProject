import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

export interface RequestDetails {
  additionalDetails: string;
  fields?: Record<string, any>;
}

interface RequestDetailsFormProps {
  onBack: () => void;
  onNext: (data: RequestDetails) => void;
  requireAdditionalDetails?: boolean;
}

export default function RequestDetailsForm(props: RequestDetailsFormProps) {
  const { onBack, onNext, requireAdditionalDetails = false } = props;
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalDetails(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (requireAdditionalDetails && !additionalDetails.trim()) {
      setError('יש למלא פרטים נוספים');
      return;
    }
    setError('');
    onNext({ additionalDetails: additionalDetails || '', fields: {} });
  };

  return (
    <div dir="rtl" lang="he" style={{ padding: '10px 12px 20px', width: '100%', boxSizing: 'border-box', margin: 0 }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #ffcdd2', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
            נימוקי הבקשה ופרטים נוספים
          </h2>

          <textarea
            name="additionalDetails"
            value={additionalDetails}
            onChange={handleTextAreaChange}
            rows={10}
            style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', resize: 'vertical' }}
          />

        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center', marginTop: '32px' }}>
          <button type="button" onClick={onBack} style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#d3d3d3', color: 'white', border: 'none', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b0b0b0')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d3d3d3')}>חזור</button>

          <button type="submit" style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#9b59b6', color: 'white', border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7d3c98')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#9b59b6')}>המשך</button>
        </div>
      </form>
    </div>
  );
}
