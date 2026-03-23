import type { MunicipalityOverrides } from '../types';
import beershevaLogo from './assets/beersheva-logo.png';

export const municipality390000Overrides: MunicipalityOverrides = {
  // Basic Information
  id: '390000',
  name: 'Municipality 390000',
  nameHebrew: 'עיריית באר שבע',
  nameEnglish: 'Beer Sheva',
  logo: beershevaLogo,

  // SOAP Configuration
  longCustomer: '390000',
  shortCustomer: '162',
  pInfoId: '162',
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
  },

  // UI Customization
  theme: {
    primaryColor: '#6a0dad',
    secondaryColor: '#d3d3d3',
  },
};
