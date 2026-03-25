import { useEffect, useState } from "react";
import { loadMunicipalityMenu, launchProcess, getTavimList } from "../api/municipalityApi";
import type { AppDataResponse } from "../models/Municipality";
import { useParams, useLocation } from "react-router-dom";
import { AppConfig } from "../config/appConfig";
import MenuWidget from "../components/Menu/MenuWidget";
import IdentificationForm from "../components/IdentificationForm";
import ApplicantDetailsForm from "../components/ApplicantDetailsForm";
import RequestDetailsForm from "../components/RequestDetailsForm";
import PatternForm from "../components/PatternForm";
import AttachmentsForm from "../components/AttachmentsForm";
import DeclarationForm from "../components/DeclarationForm";
import PageLayout from "../components/PageLayout";

type Level = "nose" | "tatNose" | "sugPniya";

export default function HomePage() {
  const [data, setData] = useState<AppDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { municipalityId } = useParams();
  const location = useLocation();

  // View state: 'menu' or 'identification' or 'applicantDetails' or 'templateDescription' or 'requestDetails' or 'attachments' or 'declaration' or 'summary' or 'paramError'
  const [currentView, setCurrentView] = useState<'menu' | 'identification' | 'applicantDetails' | 'templateDescription' | 'requestDetails' | 'attachments' | 'declaration' | 'summary' | 'paramError'>('menu');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [paramError, setParamError] = useState<string | null>(null);
  
  // Form data state
  const [identificationData, setIdentificationData] = useState<{field1: string; field2: string} | null>(null);
  const [applicantData, setApplicantData] = useState<{firstName: string; idNumber: string; lastName: string; mobilePhone: string; additionalPhone: string; email: string} | null>(null);
  const [requestDetailsData, setRequestDetailsData] = useState<{additionalDetails: string; selectedTav?: string | null; fields?: Record<string, any>} | null>(null);
  const [attachmentsData, setAttachmentsData] = useState<{attachments: {id: string; name: string; required: boolean; file: File | null}[]} | null>(null);
  const [declarationData, setDeclarationData] = useState<{signature: string} | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tavimList, setTavimList] = useState<{ ezor: string; misparTav: string; sugTav: string }[]>([]);
  const [tavimLoading, setTavimLoading] = useState(false);
  const [tavimError, setTavimError] = useState<string | null>(null);
  const [selectedTav, setSelectedTav] = useState<string | null>(null);
  const [tavimSelectionError, setTavimSelectionError] = useState<string | null>(null);

  // Load state from localStorage
  const [level, setLevel] = useState<Level>("nose");
  const [nose, setNose] = useState<any>(null);
  const [tatNose, setTatNose] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isPattern64 = Number(selectedItem?.pattern) === 64;
  const isPattern65 = Number(selectedItem?.pattern) === 65;
  const isPattern64Or65 = isPattern64 || isPattern65;
  const isPattern12 = Number(selectedItem?.pattern) === 12;

  // Check for reset
  useEffect(() => {
    if (location.state?.reset) {
      setLevel("nose");
      setNose(null);
      setTatNose(null);
      setHistory([]);
      setHistoryIndex(-1);
      setCurrentView('menu');
      setSelectedItem(null);
      localStorage.removeItem('menuLevel');
      localStorage.removeItem('menuNose');
      localStorage.removeItem('menuTatNose');
      localStorage.removeItem('menuHistory');
      localStorage.removeItem('menuHistoryIndex');
    }
  }, [location.state]);

  useEffect(() => {
    // Clear localStorage on first entry
    localStorage.removeItem('menuLevel');
    localStorage.removeItem('menuNose');
    localStorage.removeItem('menuTatNose');
    localStorage.removeItem('menuHistory');
    localStorage.removeItem('menuHistoryIndex');
    
    setLoading(true);
    loadMunicipalityMenu(municipalityId)
      .then(r => setData(r?.appDataResponse || null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [municipalityId]);

  useEffect(() => {
    if (!data || currentView !== 'menu') {
      return;
    }

    const params = new URLSearchParams(location.search);
    const noseParam = params.get('NOSE')?.trim();
    const tatParam = params.get('TAT')?.trim();
    const sugParam = params.get('SUG')?.trim();

    if (!noseParam || !tatParam || !sugParam) {
      return;
    }

    const matches = data.sugeyPniyotList.filter((item) => {
      const itemNose = String(item.nose).trim();
      const itemTat = String(item.tatNose).trim();
      const itemSug = String(item.sugPniya).trim();
      const itemSugTahalich = String((item as any).sugTahalich ?? '').trim();
      const sugMatches = itemSug === sugParam;
      const tahalichMatches = itemSugTahalich === '1';
      return itemNose === noseParam && itemTat === tatParam && sugMatches && tahalichMatches;
    });

    const match = matches[0];

    if (!match) {
      setParamError('לא נמצאה תבנית מתאימה עבור הפרמטרים שסופקו.');
      setCurrentView('paramError');
      return;
    }

    setSelectedItem(match);
    setParamError(null);
    setTavimList([]);
    setSelectedTav(null);
    setTavimError(null);
    setTavimSelectionError(null);
    setCurrentView('identification');
  }, [data, location.search, currentView]);

  async function loadTavimListForPattern64() {
    if (!identificationData) {
      setTavimError('נתוני הזדהות חסרים');
      return;
    }

    setTavimLoading(true);
    setTavimError(null);
    setTavimSelectionError(null);
    setSelectedTav(null);

    try {
      const result = await getTavimList('448', identificationData.field2 || '', identificationData.field1 || '');
      if (result.success) {
        setTavimList(result.list || []);
      } else {
        setTavimError(result.message || 'שגיאה בטעינת רשימת תווים');
        setTavimList([]);
      }
    } catch (err) {
      console.error(err);
      setTavimError('שגיאה בטעינת רשימת תווים');
      setTavimList([]);
    } finally {
      setTavimLoading(false);
    }
  }

  function handleSelect(item: any) {
    setSelectedItem(item);
    setTavimList([]);
    setSelectedTav(null);
    setTavimError(null);
    setTavimSelectionError(null);
    setCurrentView('identification');
  }

  function handleBack() {
    // Just go back to menu without resetting state
    setCurrentView('menu');
    setSelectedItem(null);
  }

  function applyHistoryState(s: any) {
    setLevel(s.level);
    setNose(s.nose ?? null);
    setTatNose(s.tatNose ?? null);
  }

  function goBack() {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      applyHistoryState(history[idx]);
    }
  }

  function goForward() {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      applyHistoryState(history[idx]);
    }
  }

  function goTo(levelName: Level) {
    const state = { level: levelName, nose: levelName === "nose" ? null : nose, tatNose: levelName === "sugPniya" ? tatNose : null };
    const next = history.slice(0, historyIndex + 1);
    next.push(state);
    setHistory(next);
    setHistoryIndex(next.length - 1);
    applyHistoryState(state);
  }

  if (loading) {
    return (
      <PageLayout currentStep={1} showStepper={false}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div className="spinner" />
        </div>
      </PageLayout>
    );
  }

  // Determine current step based on view (0-indexed for pre-selection state)
  const currentStep = 
    currentView === 'menu' ? 0 :
    currentView === 'identification' ? 1 :
    currentView === 'applicantDetails' ? 2 :
    currentView === 'templateDescription' ? 3 :
    currentView === 'requestDetails' ? 4 :
    currentView === 'attachments' ? 5 :
    currentView === 'declaration' ? 6 : 7;

  const municipality = AppConfig.getMunicipality();

  const templateConfigName = AppConfig.getMunicipality().templateConfig?.templates?.[Number(selectedItem?.pattern)]?.name;
  // Keep previous behavior: prefer selectedItem.teurSugPniya if present, otherwise fall back to templateConfig name
  const fallbackTemplateName = selectedItem ? (selectedItem.teurSugPniya || templateConfigName) : undefined;

  // Debug: log selected item and computed fallback name to help troubleshooting
  // (Remove after verifying in browser console)
  // eslint-disable-next-line no-console
  console.log('DEBUG selectedItem for template title:', { pattern: selectedItem?.pattern, teurSugPniya: selectedItem?.teurSugPniya, fallbackTemplateName });

  return (
    <PageLayout
      currentStep={currentStep}
      teurPatternLabel={selectedItem?.teurPattern}
      selectedTemplateName={fallbackTemplateName}
      isSuccess={!!processId}
    >
      <div style={{ maxWidth: "1200px", width: "100%", marginInlineStart: 0, marginInlineEnd: 'auto' }}>
        {currentView === 'paramError' ? (
          <div style={{ textAlign: 'center', padding: '40px', direction: 'rtl' }}>
            <div style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '18px'
            }}>
              {paramError || 'שגיאה בפרמטרים שסופקו'}
            </div>
          </div>
        ) : currentView === 'menu' && (!data || !data.sugeyPniyotList || data.sugeyPniyotList.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px', direction: 'rtl' }}>
            <div style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '18px'
            }}>
              לא נמצאו תבניות עבור רשות זו
            </div>
          </div>
        ) : currentView === 'menu' ? (
            <MenuWidget
              data={data}
              onSelect={handleSelect}
              level={level}
              nose={nose}
              tatNose={tatNose}
              history={history}
              historyIndex={historyIndex}
              onLevelChange={setLevel}
              onNoseChange={setNose}
              onTatNoseChange={setTatNose}
              onHistoryChange={setHistory}
              onHistoryIndexChange={setHistoryIndex}
              onGoBack={goBack}
              onGoForward={goForward}
              onGoTo={goTo}
            />
          ) : currentView === 'identification' ? (
            <IdentificationForm 
              item={selectedItem}
              initialData={identificationData}
              onBack={handleBack}
              onSuccess={(data) => {
                setIdentificationData(data);
                setCurrentView('applicantDetails');
              }}
            />
          ) : currentView === 'applicantDetails' ? (
            <ApplicantDetailsForm
              initialData={applicantData}
              identificationData={identificationData}
              item={selectedItem}
              onBack={() => setCurrentView('identification')}
              onNext={(data) => {
                console.log('Applicant details:', data);
                setApplicantData(data);
                if (isPattern64Or65) {
                  loadTavimListForPattern64();
                }
                setCurrentView('templateDescription');
              }}
            />
            ) : currentView === 'templateDescription' ? (
            isPattern64Or65 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h2 style={{ textAlign: 'center', marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                  {isPattern65
                    ? 'מבקש ביטול תוקף לתו הבא (נא לבחור תו אחד בלבד)'
                    : 'מבקש הארכת תוקף לתו הבא (נא לבחור תו אחד בלבד)'}
                </h2>

                {tavimError && (
                  <div style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    border: '1px solid #ffcdd2'
                  }}>
                    {tavimError}
                  </div>
                )}

                {tavimSelectionError && (
                  <div style={{
                    backgroundColor: '#fff3e0',
                    color: '#e65100',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    border: '1px solid #ffe0b2'
                  }}>
                    {tavimSelectionError}
                  </div>
                )}

                {tavimLoading ? (
                  <p>טוען רשימת תווים...</p>
                ) : (
                  <div style={{ maxWidth: '800px', marginInlineStart: 0, marginInlineEnd: 'auto', textAlign: 'right' }}>
                    {tavimList.length === 0 ? (
                      <p>לא נמצאו תווים להצגה</p>
                    ) : (
                      <div style={{
                        border: '1px solid #d9d9e3',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundColor: '#fff'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          backgroundColor: '#b046c3',
                          color: '#000',
                          fontWeight: 'bold',
                          padding: '12px 16px'
                        }}>
                          <div style={{ textAlign: 'center' }}>מספר תו</div>
                          <div style={{ textAlign: 'center' }}>סוג תו</div>
                          <div style={{ textAlign: 'center' }}>אזור תו</div>
                        </div>
                        {tavimList.map((tav, idx) => (
                          <label key={`${tav.misparTav}-${idx}`} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            borderTop: '1px solid #eee',
                            backgroundColor: selectedTav === tav.misparTav ? '#f3e5f5' : '#fff',
                            cursor: 'pointer'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <input
                                type="radio"
                                name="tavim"
                                value={tav.misparTav}
                                checked={selectedTav === tav.misparTav}
                                onChange={() => {
                                  setSelectedTav(tav.misparTav);
                                  setTavimSelectionError(null);
                                }}
                                style={{ marginLeft: '8px' }}
                              />
                              {tav.misparTav}
                            </div>
                            <div style={{ textAlign: 'center' }}>{tav.sugTav}</div>
                            <div style={{ textAlign: 'center' }}>{tav.ezor}</div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                  <button
                    onClick={() => setCurrentView('applicantDetails')}
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      backgroundColor: '#d3d3d3',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b0b0b0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d3d3d3'}
                  >
                    חזור
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedTav) {
                        setTavimSelectionError('יש לבחור תו אחד לפני מעבר לשלב הבא');
                        return;
                      }
                      setCurrentView('requestDetails');
                    }}
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7d3c98'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9b59b6'}
                  >
                    המשך
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                {/* inline logo removed per request */}
                {municipality && (
                  <PatternForm
                    initialData={requestDetailsData}
                    selectedItem={selectedItem}
                    municipalityId={municipalityId}
                    onBack={() => setCurrentView('applicantDetails')}
                    onSave={(data) => {
                      setRequestDetailsData((prev) => ({
                        additionalDetails: prev?.additionalDetails ?? '',
                        selectedTav: prev?.selectedTav,
                        fields: data.fields
                      }));
                    }}
                    onNext={(data) => {
                      setRequestDetailsData((prev) => ({
                        additionalDetails: prev?.additionalDetails ?? '',
                        selectedTav: prev?.selectedTav,
                        fields: data.fields
                      }));
                      setCurrentView('requestDetails');
                    }}
                  />
                )}
              </div>
            )
          ) : currentView === 'requestDetails' ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              {/* inline logo removed per request */}
              {/* pattern preview removed on Request Details page */}

              <div style={{ marginTop: '20px' }}>
                <RequestDetailsForm
                  requireAdditionalDetails={isPattern12}
                    onBack={() => setCurrentView('templateDescription')}
                    initialAdditionalDetails={requestDetailsData?.additionalDetails || ''}
                    initialFields={requestDetailsData?.fields || {}}
                    onNext={(data) => {
                    console.log('Request details:', data);
                    setRequestDetailsData({
                      ...data,
                      selectedTav: isPattern64Or65 ? selectedTav : undefined
                    });
                    setCurrentView('attachments');
                  }}
                />
              </div>
            </div>
          ) : currentView === 'attachments' ? (
            <AttachmentsForm
              initialData={attachmentsData}
              selectedItem={selectedItem}
              identificationData={identificationData}
              requestDetailsData={requestDetailsData}
              onBack={() => setCurrentView('requestDetails')}
              onNext={(data) => {
                console.log('Attachments:', data);
                setAttachmentsData(data);
                setCurrentView('declaration');
              }}
            />
          ) : currentView === 'declaration' ? (
            <DeclarationForm
              initialData={declarationData}
              selectedItem={selectedItem}
              isSubmitting={isSubmitting}
              onBack={() => setCurrentView('attachments')}
              onNext={async (data) => {
                console.log('Declaration:', data);
                setDeclarationData(data);
                
                // Launch the process
                if (!selectedItem || !identificationData || !applicantData) {
                  console.error('Missing required data for process launch');
                  return;
                }
                
                setIsSubmitting(true);
                try {
                  const result = await launchProcess(
                    identificationData.field1, // payerNum
                    identificationData.field2, // phisiNum
                    selectedItem.noseBilling || '', // subject
                    '448', // pInfoId
                    selectedItem.nose || '', // nose
                    selectedItem.tatNose || '', // tatNose
                    selectedItem.sugPniya || '0', // sugPniya
                    selectedItem.sugPniyaB || '', // sugPniyaB
                    selectedItem.pattern || 0, // pattern
                    applicantData,
                    requestDetailsData,
                    attachmentsData,
                    data.signature,
                    {
                      noseName: nose?.shemNose || '',
                      noseDescription: nose?.teur || '',
                      tatNoseName: tatNose?.shemNose || '',
                      tatNoseDescription: tatNose?.teur || '',
                      sugDescription: selectedItem.teurSugPniya || '',
                      templateDescription: selectedItem.teurPattern || '',
                      zmanTekenSiyom: selectedItem.zmanTekenSiyom || ''
                    }
                  );
                  
                  console.log('Launch process result:', result);
                  
                  if (result.success) {
                    // Store the process ID and move to summary
                    setProcessId(result.processId || null);
                    setCurrentView('summary');
                  } else {
                    alert('שגיאה: ' + (result.message || 'לא הצלחנו לשלוח את הבקשה'));
                  }
                } catch (error) {
                  console.error('Error launching process:', error);
                  alert('שגיאה בשליחת הבקשה');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '10px',
              direction: 'rtl', marginTop: '100px'  
            }}>
              {processId ? (
                <>
                  <div style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    ✓ נפתחה פניה מספר {processId}
                  </div>
                  <p style={{ fontSize: '20px', marginBottom: '30px' }}>
                    הפניה שלך נקלטה בהצלחה במערכת
                  </p>
                </>
              ) : (
                <div style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  marginBottom: '30px',
                  fontSize: '20px'
                }}>
                  שגיאה בשליחת הבקשה
                </div>
              )}
            </div>
          )}
        </div>
      </PageLayout>
    );
}
