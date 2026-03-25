import type { MunicipalityOverrides } from '../types';
import modiinLogo from './assets/modiin-logo.jpg';

export const municipality813510Overrides: MunicipalityOverrides = {
  // Basic Information
  id: '813510',
  name: 'Municipality 813510',
  nameHebrew: 'רשות מקומית מודיעין',
  nameEnglish: 'Modiin',
  logo: modiinLogo,

  // SOAP Configuration
  longCustomer: '813510',
  shortCustomer: '256',
  pInfoId: '618',
  recipient: '27',
  sender: '2',
  token: '1',
  userId: '024147076',
  userPass: '30100205',

  // Template & Form Configuration
  templateConfig: {
    globalFields: {
      showPhisiNum: true,
      showPayerNum: true,
      showApplicantId: true,
      showAdditionalPhone: true,
    },
    templates: {
      12: {
        name: 'ערעור על דוח חניה',
        fields: [
          {
            name: 'ext12_RBMailDoar',
            label: 'אופן קבלת התשובה (לתשומת ליבך,תשובה שתשלח בדואר אלקטרוני לא תשלח בדואר ישראל)',
            type: 'select',
            required: false,
            visible: true,
            options: [
              { value: '1', label: 'דואר אלקטרוני' },
              { value: '0', label: 'דואר ישראל' },
            ],
            defaultValue: '1',
          },
        ],
      },
    },
  },

  // UI Customization
  theme: {
    primaryColor: '#6a0dad',
    secondaryColor: '#d3d3d3',
  },
};
