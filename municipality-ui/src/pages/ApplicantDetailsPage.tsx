import React from 'react';
import ApplicantDetailsForm, { ApplicantDetails } from '../components/ApplicantDetailsForm';

export default function ApplicantDetailsPage() {
  const handleBack = () => {
    // Navigate back to previous page
    window.history.back();
  };

  const handleNext = (data: ApplicantDetails) => {
    console.log('Applicant details submitted:', data);
    // TODO: Navigate to next step or save data
    alert('פרטי הפונה נשמרו בהצלחה');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      paddingTop: '40px'
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '32px',
        fontFamily: 'Arial, sans-serif'
      }}>
        פרטי הפונה
      </h1>
      
      <ApplicantDetailsForm 
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}
