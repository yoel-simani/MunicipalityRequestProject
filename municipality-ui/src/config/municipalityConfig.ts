// Municipality Configuration Interface
export interface MunicipalityConfig {
  // Basic Information
  id: string;
  name: string;
  nameHebrew: string;
  nameEnglish: string;
  logo: string; // Path to logo in public folder
  
  // SOAP Configuration
  longCustomer: string;
  shortCustomer: string;
  pInfoId: string;
  recipient: string;
  sender: string;
  token: string;
  userId: string;
  userPass: string;
  
  // Template & Form Configuration
  templateConfig: TemplateConfig;
  
  // UI Customization
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface TemplateConfig {
  // Global form field visibility
  globalFields: {
    showPhisiNum: boolean;
    showPayerNum: boolean;
    showApplicantId: boolean;
    showAdditionalPhone: boolean;
  };
  
  // Template-specific configurations (by pattern number)
  templates: {
    [patternId: number]: TemplateDefinition;
  };
}

export interface TemplateDefinition {
  name: string;
  fields: TemplateFieldConfig[];
  requiredAttachments?: string[];
}

export interface TemplateFieldConfig {
  name: string; // Field name for SOAP (e.g., 'txtField1')
  label: string; // Hebrew label for UI
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  visible: boolean;
  options?: { value: string; label: string }[]; // For select fields
  dataSource?: 'settlements' | 'streets' | 'appealReasons' | `table:${string}`;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  defaultValue?: string | number | boolean;
}

// Current Municipality Singleton
let currentMunicipality: MunicipalityConfig | null = null;

export const setCurrentMunicipality = (config: MunicipalityConfig) => {
  currentMunicipality = config;
};

export const getCurrentMunicipality = (): MunicipalityConfig => {
  if (!currentMunicipality) {
    throw new Error('Municipality not initialized. Call setCurrentMunicipality first.');
  }
  return currentMunicipality;
};
