import React, { useState } from 'react';

interface ApplicantDetailsFormProps {
  onBack: () => void;
  onNext: (data: ApplicantDetails) => void;
  initialData?: ApplicantDetails | null;
  identificationData?: {field1: string; field2: string} | null;
  item?: any;
}

export interface ApplicantDetails {
  firstName: string;
  idNumber: string;
  lastName: string;
  mobilePhone: string;
  additionalPhone: string;
  email: string;
}

export default function ApplicantDetailsForm({ onBack, onNext, initialData, identificationData, item }: ApplicantDetailsFormProps) {
  const shouldUseIdentificationId = (item?.koteretMeshalem || '').trim() === 'מספר זהות';
  const isValidIsraeliID = (id: string) => {
    const value = String(id).trim();
    if (value.length > 9 || value.length < 5 || isNaN(Number(value))) {
      return false;
    }

    if (value.length === 9 && value.startsWith('5')) {
      return true;
    }

    const padded = value.length < 9 ? ("000000000" + value).slice(-9) : value;
    const sum = Array.from(padded, Number).reduce((counter, digit, i) => {
      const step = digit * (i % 2 + 1);
      return counter + (step > 9 ? step - 9 : step);
    }, 0);
    return sum % 10 === 0;
  };
  const [formData, setFormData] = useState<ApplicantDetails>({
    firstName: initialData?.firstName || '',
    idNumber: initialData?.idNumber || (shouldUseIdentificationId ? identificationData?.field1 || '' : ''),
    lastName: initialData?.lastName || '',
    mobilePhone: initialData?.mobilePhone || '',
    additionalPhone: initialData?.additionalPhone || '',
    email: initialData?.email || ''
  });

  const [errors, setErrors] = useState<Partial<ApplicantDetails>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name as keyof ApplicantDetails]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ApplicantDetails> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'שדה חובה';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'שדה חובה';
    } else if (!isValidIsraeliID(formData.idNumber)) {
      newErrors.idNumber = 'מספר זיהוי לא תקין';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'שדה חובה';
    }

    if (!formData.mobilePhone.trim()) {
      newErrors.mobilePhone = 'שדה חובה';
    } else if (!/^05\d{8}$/.test(formData.mobilePhone.replace(/-/g, ''))) {
      newErrors.mobilePhone = 'מספר טלפון לא תקין';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'שדה חובה';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת מייל לא תקינה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext(formData);
    }
  };

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
        <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>פרטי הפונה</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            textAlign: 'right'
          }}>
            ת.ז מגיש הבקשה (חובה) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleInputChange}
            placeholder="הזן ת.ז מגיש הבקשה (חובה)"
            maxLength={9}
            style={{
              width: '100%',
              padding: '12px',
              minHeight: 48,
              fontSize: '14px',
              border: errors.idNumber ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box'
            }}
          />
          {errors.idNumber && (
            <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.idNumber}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            textAlign: 'right'
          }}>
            שם פרטי (חובה) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="הזן שם פרטי (חובה)"
            style={{
              width: '100%',
              padding: '12px',
              minHeight: 48,
              fontSize: '14px',
              border: errors.firstName ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box'
            }}
          />
          {errors.firstName && (
            <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.firstName}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            textAlign: 'right'
          }}>
            שם משפחה (חובה) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="הזן שם משפחה (חובה)"
            style={{
              width: '100%',
              padding: '12px',
              minHeight: 48,
              fontSize: '14px',
              border: errors.lastName ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box'
            }}
          />
          {errors.lastName && (
            <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.lastName}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            textAlign: 'right'
          }}>
            טלפון נייד (חובה) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="tel"
            name="mobilePhone"
            value={formData.mobilePhone}
            onChange={handleInputChange}
            placeholder="הזן טלפון נייד (חובה)"
            style={{
              width: '100%',
              padding: '12px',
              minHeight: 48,
              fontSize: '14px',
              border: errors.mobilePhone ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box'
            }}
          />
          {errors.mobilePhone && (
            <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.mobilePhone}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            textAlign: 'right'
          }}>
            טלפון נוסף
          </label>
          <input
            type="tel"
            name="additionalPhone"
            value={formData.additionalPhone}
            onChange={handleInputChange}
            placeholder="טלפון נוסף"
            style={{
              width: '100%',
              padding: '12px',
              minHeight: 48,
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            textAlign: 'right'
          }}>
            מייל (חובה) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="הזן כתובת מייל (חובה)"
            style={{
              width: '100%',
              padding: '12px',
              minHeight: 48,
              fontSize: '14px',
              border: errors.email ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box'
            }}
          />
          {errors.email && (
            <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.email}
            </span>
          )}
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
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#e0e0e0',
              color: '#333',
              border: 'none',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#d0d0d0';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            → חזור
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
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#8e44ad';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#9b59b6';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            הבא ←
          </button>
        </div>
      </form>
    </div>
  );
}
