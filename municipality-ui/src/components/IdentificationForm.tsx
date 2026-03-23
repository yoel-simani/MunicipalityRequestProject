import React, { useState } from 'react';
import { checkPhisiBySubject } from '../api/municipalityApi';

interface IdentificationFormProps {
  item: any;
  onBack: () => void;
  onSuccess?: (data: {field1: string; field2: string}) => void;
  initialData?: {field1: string; field2: string} | null;
}

export default function IdentificationForm({ item, onBack, onSuccess, initialData }: IdentificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; data: any } | null>(null);
  const [formData, setFormData] = useState({
    field1: initialData?.field1 || '',
    field2: initialData?.field2 || ''
  });

  if (!item) {
    return <div>לא נבחרה תבנית</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error/success when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate fields using the SOAP API
      const validationResult = await checkPhisiBySubject(
        formData.field1, // payerNum (koteretMeshalem)
        formData.field2, // phisiNum (koteretPhizi)
        item.noseBilling || '', // subject
        '448', // pInfoId (דינמי לפי רשות)
        '0', // sugPniya
        item.sugPniya || '' // sugPniyaB
      );

      console.log("Validation result:", validationResult);

      if (validationResult.isValid) {
        const defaultMessage = "הזדהות בוצעה בהצלחה";
        setSuccess({
          message: defaultMessage,
          data: validationResult.data
        });
        // Navigate to next step after showing success message
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(formData);
          }
        }, 1500);
      } else {
        setError(validationResult.message || "השדות לא תקינים");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setError("שגיאה בשליחת הטופס");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" lang="he" style={{ padding: '10px 12px 20px', width: '100%', boxSizing: 'border-box', margin: 0 }}>
      <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>הזדהות</h2>

      {/* Explanation field - always show */}
      <div style={{
        backgroundColor: "#f5f5f5",
        padding: "0px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <label style={{
          display: "block",
          fontWeight: "normal",
          marginBottom: "8px",
          color: "#333",
          fontSize: "14px"
        }}>
          דברי הסבר
        </label>
        <div style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "transparent",
          borderRadius: "4px",
          border: "1px solid #ccc",
          minHeight: "60px",
          fontSize: "14px",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
          boxSizing: "border-box"
        }}>
          {item.explanation || 'אין דברי הסבר'}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#ffebee",
          color: "#c62828",
          padding: "10px",
          borderRadius: "4px",
          marginBottom: "15px",
          border: "1px solid #ffcdd2"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: "#e8f5e9",
          color: "#2e7d32",
          padding: "10px",
          borderRadius: "4px",
          marginBottom: "15px",
          border: "1px solid #c8e6c9"
        }}>
          <strong>✓ {success.message}</strong>
          {success.data && (
            <div style={{ marginTop: 10, fontSize: 14, backgroundColor: "#f5f5f5", padding: 10, borderRadius: 4 }}>
              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {JSON.stringify(success.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div>
            <label htmlFor="field1" style={{ display: "block", marginBottom: 5, fontWeight: "normal" }}>
              {item.koteretMeshalem || "שדה 1"}
            </label>
            <input
              type="text"
              id="field1"
              name="field1"
              value={formData.field1}
              onChange={handleInputChange}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4, minHeight: 48, fontSize: 14, lineHeight: 1.6, boxSizing: 'border-box' }}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="field2" style={{ display: "block", marginBottom: 5, fontWeight: "normal" }}>
              {item.koteretPhizi || "שדה 2"}
            </label>
            <input
              type="text"
              id="field2"
              name="field2"
              value={formData.field2}
              onChange={handleInputChange}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4, minHeight: 48, fontSize: 14, lineHeight: 1.6, boxSizing: 'border-box' }}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px',
          alignItems: 'center',
          marginTop: '32px' 
        }}>
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: isSubmitting ? '#ccc' : '#e0e0e0',
              color: '#333',
              border: 'none',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#d0d0d0';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            → חזור
          </button>

          {/* Next Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: isSubmitting ? '#ccc' : '#9b59b6',
              color: 'white',
              border: 'none',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#8e44ad';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#9b59b6';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isSubmitting ? '...' : 'הבא ←'}
          </button>
        </div>
      </form>
    </div>
  );
}