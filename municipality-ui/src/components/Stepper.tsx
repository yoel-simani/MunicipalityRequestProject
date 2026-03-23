import React from 'react';

export interface Step {
  id: number;
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepperProps {
  steps: Step[];
}

export default function Stepper({ steps }: StepperProps) {
  return (
    <div style={{
      backgroundColor: '#9b59b6',
      padding: '10px 22px',
      direction: 'rtl'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '14px',
        justifyContent: 'flex-start',
        direction: 'ltr'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <img
            src="/assets/logos/company-logo.jpg"
            alt="Company Logo"
            style={{
              height: '52px',
              maxWidth: '220px',
              objectFit: 'contain'
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px'
        }}>
          <span
            aria-label="OneClick"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              color: '#0061A7',
              fontSize: '22px',
              fontWeight: '500'
            }}
          >
            <span
              style={{
                width: '34px',
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <img
                src="/assets/logos/oneclick-icon.png"
                alt="OneClick"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </span>
            <span style={{ marginRight: '6px' }}>ne</span>
            <span>Click</span>
          </span>
        </div>
      </div>

      {/* Steps Progress Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: step.completed ? '#4caf50' : step.active ? 'white' : 'rgba(255,255,255,0.4)',
                border: step.active ? '3px solid white' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step.active ? '#9b59b6' : 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}>
                {step.completed ? '✓' : step.id}
              </div>
              {
                // If this is step 4 (template description), show label in same style as the form h2
              }
              <span style={{
                color: 'white',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                opacity: step.active ? 1 : 0.7
              }}>
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div style={{
                width: '120px',
                height: '2px',
                backgroundColor: step.completed ? '#4caf50' : 'rgba(255,255,255,0.3)',
                marginBottom: '24px',
                transition: 'all 0.3s ease'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
