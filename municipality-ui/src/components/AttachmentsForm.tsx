import React, { useState, useEffect } from 'react';
import { getRequiredAttachments } from '../api/municipalityApi';

interface AttachmentsFormProps {
  onBack: () => void;
  onNext: (data: AttachmentsData) => void;
  initialData?: AttachmentsData | null;
  selectedItem?: any; // Contains sugPniya, pattern, etc.
  identificationData?: {field1: string; field2: string} | null;
  requestDetailsData?: { fields?: Record<string, any> } | null;
}

export interface AttachmentItem {
  id: string;
  name: string;
  required: boolean;
  docGroup?: string;
  file: File | null;
}

export interface AttachmentsData {
  attachments: AttachmentItem[];
}

export default function AttachmentsForm({ onBack, onNext, initialData, selectedItem, identificationData, requestDetailsData }: AttachmentsFormProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialData?.attachments || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const selectedReason = requestDetailsData?.fields?.cmbSibatIrur;

  useEffect(() => {
    // Load required attachments from API
    const loadAttachments = async () => {
      if (!selectedItem) {
        setError('לא נבחרה תבנית');
        setLoading(false);
        return;
      }

      if (!identificationData) {
        setError('נתוני הזדהות חסרים');
        setLoading(false);
        return;
      }

      if (initialData?.attachments && initialData.attachments.length > 0) {
        const filtered = selectedReason
          ? initialData.attachments.filter((att) => {
              const group = String(att.docGroup || '');
              return group === '' || group === String(selectedReason);
            })
          : initialData.attachments;
        setAttachments(filtered);
        setLoading(false);
        return;
      }

      try {
        const result = await getRequiredAttachments(
          identificationData.field1, // payerNum
          identificationData.field2, // phisiNum
          selectedItem.noseBilling || '', // subject
          '448', // pInfoId
          selectedItem.nose || '', // nose
          selectedItem.tatNose || '', // tatNose
          selectedItem.sugPniya || '0', // sugPniya
          selectedItem.sugPniyaB || '', // sugPniyaB
          selectedItem.pattern || 0 // pattern
        );
        
        if (result.success && result.attachments) {
          const filtered = selectedReason
            ? result.attachments.filter((att) => {
              const group = String(att.docGroup || '');
              return group === '' || group === String(selectedReason);
            })
            : result.attachments;
          const existingById = new Map((initialData?.attachments || []).map((att) => [att.id, att]));
          const merged = filtered.map((att) => {
            const existing = existingById.get(att.id);
            return existing?.file ? { ...att, file: existing.file } : att;
          });
          setAttachments(merged);
        } else {
          setError(result.message || 'שגיאה בטעינת רשימת הקבצים');
        }
      } catch (err) {
        console.error('Error loading attachments:', err);
        setError('שגיאה בטעינת רשימת הקבצים הנדרשים');
      } finally {
        setLoading(false);
      }
    };

    loadAttachments();
  }, [selectedItem, identificationData, selectedReason, initialData?.attachments]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const updatedAttachments = [...attachments];
      updatedAttachments[index].file = file;
      setAttachments(updatedAttachments);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedAttachments = [...attachments];
    updatedAttachments[index].file = null;
    setAttachments(updatedAttachments);
    
    // Reset the file input element
    const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required attachments
    const missingRequired = attachments.filter(att => att.required && !att.file);
    if (missingRequired.length > 0) {
      setError(`יש להעלות את הקבצים הנדרשים: ${missingRequired.map(a => a.name).join(', ')}`);
      return;
    }
    
    setError('');
    onNext({ attachments });
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        margin: 0,
        padding: '10px 12px 20px',
        textAlign: 'center',
        direction: 'rtl',
        boxSizing: 'border-box'
      }}>
        <h2>טוען רשימת קבצים נדרשים...</h2>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      margin: 0,
      padding: '10px 12px 20px',
      direction: 'rtl',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      <form onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>קבצים מצורפים</h2>
        
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {error}
          </div>
        )}

        {attachments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p>לא נדרשים קבצים מצורפים לתבנית זו</p>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            {attachments.map((attachment, index) => (
              <div key={attachment.id} style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: `2px solid ${attachment.required ? '#ff9800' : '#ddd'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '240px',
                    flex: '0 0 240px',
                    fontSize: '16px',
                    fontWeight: 'normal',
                    color: '#333'
                  }}>
                    {attachment.name}
                    {attachment.required && (
                      <span style={{ color: '#ff9800', marginRight: '5px' }}>*</span>
                    )}
                  </label>

                  <input
                    id={`file-input-${index}`}
                    type="file"
                    onChange={(e) => handleFileChange(index, e)}
                    style={{
                      padding: '8px 10px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />

                  {attachment.file && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      הסר
                    </button>
                  )}

                  {attachment.file && (
                    <span style={{
                      fontSize: '13px',
                      color: '#2e7d32',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '320px'
                    }}>
                      ✓ הועלה: {attachment.file.name} ({(attachment.file.size / 1024).toFixed(2)} KB)
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            <p style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '15px',
              textAlign: 'right'
            }}>
              * שדות מסומנים בכתום הם חובה
            </p>
            <p style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '5px',
              textAlign: 'right'
            }}>
              פורמטים נתמכים: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>
        )}

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
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#d3d3d3',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b0b0b0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d3d3d3'}
          >
            חזור
          </button>

          {/* Next Button */}
          <button
            type="submit"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7d3c98'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9b59b6'}
          >
            המשך
          </button>
        </div>
      </form>
    </div>
  );
}
