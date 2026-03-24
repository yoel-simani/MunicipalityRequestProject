import React from 'react';
import Stepper from './Stepper';
import { AppConfig } from '../config/appConfig';

interface Step {
  id: number;
  label: string;
  completed: boolean;
  active: boolean;
}

interface PageLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  showStepper?: boolean;
  teurPatternLabel?: string;
  selectedTemplateName?: string;
  isSuccess?: boolean;
}

export default function PageLayout({ children, currentStep, showStepper = true, teurPatternLabel, selectedTemplateName, isSuccess = false }: PageLayoutProps) {
  const municipality = AppConfig.getMunicipality();
  const cleanedPatternHtml = '';
  const steps: Step[] = [
    {
      id: 1,
      label: 'בחירת תבנית',
      completed: currentStep > 0,
      active: currentStep === 0
    },
    {
      id: 2,
      label: 'הזדהות',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      id: 3,
      label: 'פרטי הפונה',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 4,
      label: teurPatternLabel || selectedTemplateName || 'תיאור התבנית',
      completed: currentStep > 3,
      active: currentStep === 3
    },
    {
      id: 5,
      label: 'השלמת פרטים',
      completed: currentStep > 4,
      active: currentStep === 4
    },
    {
      id: 6,
      label: 'קבצים מצורפים',
      completed: currentStep > 5,
      active: currentStep === 5
    },
    {
      id: 7,
      label: 'הצהרה ואישור',
      completed: currentStep > 6,
      active: currentStep === 6
    },
    {
      id: 8,
      label: 'סיכום',
      completed: isSuccess && currentStep === 7,
      active: currentStep === 7
    }
  ];

  return (
    <div dir="rtl" lang="he" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {showStepper && <Stepper steps={steps} />}

      <main style={{
        flex: 1,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: currentStep === 3 ? '87px' : '150px',
          flex: 1,
          height: '100%',
          backgroundColor: '#fff'
        }}>
          <aside style={{
            width: '260px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '80px',
            paddingTop: '24px'
          }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img
                src={municipality.logo}
                alt={municipality.nameHebrew}
                style={{ width: '220px', height: 'auto', objectFit: 'contain', backgroundColor: '#fff' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/logos/municipality-logo.jpg';
                }}
              />
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0px' }}>
              {
                (selectedTemplateName || currentStep === 0) && (
                  <h2 style={{ display: 'block', textAlign: 'right', margin: 0, paddingRight: '8px', fontSize: '48px', fontWeight: 800, fontFamily: 'Arial, sans-serif', color: '#222', lineHeight: '1', maxWidth: '260px', overflow: 'visible', boxSizing: 'border-box' }}>
                    {selectedTemplateName ? (
                      selectedTemplateName
                    ) : (currentStep === 0 ? (
                      <>
                        <span>שירותים</span>
                        <br />
                        <span>מקוונים לתושב</span>
                      </>
                    ) : '')}
                  </h2>
                )
              }
            </div>
          </aside>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', minHeight: 0 }}>
            <div style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              height: '100%',
              overflowY: 'auto'
            }}>
              <div style={{
                width: '100%',
                maxWidth: '820px',
                margin: '0',
                marginInlineStart: '150px',
                marginInlineEnd: 'auto'
              }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{
        backgroundColor: '#f8f9fa',
        padding: '10px 16px',
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', flexDirection: 'row-reverse' }}>
          <img
            src="/assets/logos/company-logo.jpg"
            alt="Company Logo"
            style={{ height: '24px', objectFit: 'contain' }}
          />
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            © 2026 הרשות המקומית - כל הזכויות שמורות
          </p>
        </div>
      </footer>
    </div>
  );
}

