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
  // Inline removal of heading tags will be done directly when rendering the description.

  return (
    <div style={{width: '820px', textAlign: 'center', padding: '20px' }}>
      <div style={{ marginTop: '-20px' }}>
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
