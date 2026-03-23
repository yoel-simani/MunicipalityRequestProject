import React, { useState, useRef, useEffect } from 'react';

interface DeclarationFormProps {
  onBack: () => void;
  onNext: (data: DeclarationData) => void;
  initialData?: DeclarationData | null;
  selectedItem?: any; // Contains statmentTitle and statmentBody
  isSubmitting?: boolean;
}

export interface DeclarationData {
  signature: string; // base64 image of signature
}

export default function DeclarationForm({ onBack, onNext, initialData, selectedItem, isSubmitting = false }: DeclarationFormProps) {
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && initialData?.signature) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = initialData.signature;
    }
  }, [initialData]);

  const declarationTitle = selectedItem?.statmentTitle || 'הצהרה ואישור';
  const declarationText = selectedItem?.statmentBody || `הצהרה ואישור

אני החתום מטה, מצהיר/ה בזאת כי:

1. כל הפרטים שמסרתי במסמך זה הם נכונים ומדויקים למיטב ידיעתי.

2. אני מודע/ת לכך שמסירת פרטים כוזבים עלולה להוביל לביטול הבקשה ו/או לנקיטת הליכים משפטיים.

3. אני מאשר/ת לרשות לעשות שימוש בפרטים שמסרתי לצורך טיפול בבקשה זו.

4. אני מאשר/ת קבלת עדכונים והודעות הקשורות לבקשה זו באמצעות הדואר האלקטרוני ו/או מספר הטלפון שמסרתי.

5. ידוע לי כי הרשות רשאית לדרוש ממני מסמכים ו/או הבהרות נוספים לצורך בחינת הבקשה.

6. הנני מתחייב/ת לעדכן את הרשות בכל שינוי בפרטים שמסרתי.`;

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasSignature) {
      setError('יש לחתום על ההצהרה על מנת להמשיך');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    setError('');
    onNext({ signature: signatureData });
  };

  return (
    <div style={{
      width: '100%',
      margin: 0,
      padding: '10px 12px 20px',
      direction: 'rtl',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {/* Loading Spinner Overlay */}
      {isSubmitting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '8px solid #f3f3f3',
            borderTop: '8px solid #9b59b6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: 'white',
            fontSize: '20px',
            marginTop: '20px',
            fontWeight: 'bold'
          }}>
            שולח את הבקשה...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Declaration Title */}
        <h2 style={{
          textAlign: 'center',
          marginTop: 0,
          marginBottom: '10px',
          color: '#333',
          fontSize: '18px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }}>
          {declarationTitle}
        </h2>

        <div style={{ marginBottom: '10px' }}>
          <div style={{
            width: '100%',
            minHeight: '160px',
            padding: '20px',
            fontSize: '14px',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            textAlign: 'right',
            boxSizing: 'border-box',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
            maxHeight: '220px'
          }}>
            {declarationText}
          </div>
        </div>

        {/* Signature Canvas */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: 'normal',
            marginBottom: '10px'
          }}>
            חתימה דיגיטלית *
          </label>
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                border: '1px solid #ccc',
                backgroundColor: 'white',
                cursor: 'crosshair',
                width: '100%',
                display: 'block',
                touchAction: 'none'
              }}
            />
            <button
              type="button"
              onClick={clearSignature}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
            >
              נקה חתימה
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            color: 'red',
            fontSize: '14px',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {error}
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
