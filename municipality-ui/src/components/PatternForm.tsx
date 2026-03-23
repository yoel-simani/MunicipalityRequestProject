import type { RequestDetails } from './RequestDetailsForm';
import TemplateFields from './TemplateFields';

interface PatternFormProps {
  initialData?: RequestDetails | null;
  selectedItem?: any;
  municipalityId?: string;
  onBack: () => void;
  onNext: (data: RequestDetails) => void;
  onSave?: (data: RequestDetails) => void;
}

export default function PatternForm({ initialData, selectedItem, municipalityId, onBack, onNext, onSave }: PatternFormProps) {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {/* Render template description above the template fields */}
      {selectedItem && selectedItem.teurPattern ? (
        <div style={{ marginTop: '20px', textAlign: 'right', maxWidth: '800px', margin: '20px auto', fontSize: '16px', lineHeight: '1.6' }}>
          <div dangerouslySetInnerHTML={{ __html: selectedItem.teurPattern }} />
        </div>
      ) : (
        <p>אין תיאור זמין עבור תבנית זו</p>
      )}

      <div style={{ marginTop: '20px' }}>
        <TemplateFields
          initialData={initialData}
          selectedItem={selectedItem}
          municipalityId={municipalityId}
          onBack={onBack}
          onNext={onNext}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
