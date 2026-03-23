import type { MunicipalityConfig } from '../../config/municipalityConfig';

export const defaultMunicipalityConfig: MunicipalityConfig = {
  // Basic Information
  id: 'default',
  name: 'Municipality',
  nameHebrew: 'רשות מקומית',
  nameEnglish: 'Municipality',
  logo: '/assets/logos/municipality-logo.jpg',

  // SOAP Configuration
  longCustomer: '',
  shortCustomer: '',
  pInfoId: '',
  recipient: '',
  sender: '',
  token: '',
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
      64: {
        name: 'תבנית 64',
        fields: [],
        requiredAttachments: ['תעודת זהות', 'אישור בעלות'],
      },
      65: {
        name: 'תבנית 65',
        fields: [],
        requiredAttachments: ['תעודת זהות', 'אישור בעלות'],
      },
      68: {
        name: 'תבנית 68',
        fields: [
          {
            name: 'txtDifferentField',
            label: 'שדה אחר',
            type: 'textarea',
            required: true,
            visible: true,
          },
        ],
        requiredAttachments: ['תצהיר'],
      },
      12: {
        name: 'ערעור על דוח חניה',
        fields: [
          {
            name: 'isVehicleOwner',
            label: 'האם את/ה בעל/ת הרכב? (חובה)',
            type: 'select',
            required: true,
            visible: true,
            options: [
              { value: 'yes', label: 'כן' },
              { value: 'no', label: 'לא' },
            ],
          },
          {
            name: 'cmbSibatIrur',
            label: 'סיבת ערעור (חובה)',
            type: 'select',
            required: true,
            visible: true,
            dataSource: 'appealReasons',
          },
          {
            name: 'ddlYeshuv',
            label: 'שם ישוב (חובה)',
            type: 'select',
            required: true,
            visible: true,
            dataSource: 'settlements',
          },
          {
            name: 'ddlRechov',
            label: 'שם רחוב (חובה)',
            type: 'select',
            required: true,
            visible: true,
            dataSource: 'streets',
          },
          {
            name: 'txtMisparBayit',
            label: 'מספר בית (חובה)',
            type: 'number',
            required: true,
            visible: true,
          },
          {
            name: 'txtOtBayit',
            label: 'אות בית',
            type: 'text',
            required: false,
            visible: true,
          },
          {
            name: 'txtMisparDira',
            label: 'מספר דירה',
            type: 'text',
            required: false,
            visible: true,
          },
          {
            name: 'txtKnisa',
            label: 'כניסה',
            type: 'text',
            required: false,
            visible: true,
          },
          {
            name: 'txtTeDoar',
            label: 'תא דואר',
            type: 'text',
            required: false,
            visible: true,
          },
          {
            name: 'txtMikud',
            label: 'מיקוד',
            type: 'text',
            required: false,
            visible: true,
          },
          {
            name: 'ext12_RBMailDoar',
            label: 'מאשר קבלת תשובה במייל בלבד',
            type: 'checkbox',
            required: false,
            visible: true,
            defaultValue: true,
          },
        ],
        requiredAttachments: ['צילום הדוח'],
      },
    },
  },
  // UI Customization
  theme: {
    primaryColor: '#6a0dad',
    secondaryColor: '#d3d3d3',
  },
};
