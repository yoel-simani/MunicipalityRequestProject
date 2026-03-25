import type { ApiResponse } from "../models/Municipality";
import { AppConfig } from "../config/appConfig";

export async function loadMunicipalityMenu(
  municipalityId?: string
): Promise<ApiResponse> {
  // Use municipality from config if not provided
  const municipality = AppConfig.getMunicipality();
  const id = municipalityId || municipality.longCustomer;
  const url = `${AppConfig.apiBaseUrl}/${id}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to load municipality data: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("API error, using mock data", error);
    // Return mock data for testing
    return {
      appDataResponse: {
        noseimList: [
          { noseId: "1", shemNose: "נושא 1", teur: "תיאור נושא 1" },
          { noseId: "2", shemNose: "נושא 2", teur: "תיאור נושא 2" },
        ],
        TateyNoseimList: [
          { noseId: "1", noseAv: 1, shemNose: "תת נושא 1", teur: "תיאור תת נושא 1" },
        ],
        sugeyPniyotList: [
          { nose: "1", tatNose: "1", sugPniya: "1", teurSugPniya: "סוג פנייה 1", pattern: 1, koteretMeshalem: "שם מלא", koteretPhizi: "תעודת זהות", noseBilling: "123", sugPniyaB: "1" },
        ],
      },
    };
  }
}

export async function getSettlements(params?: { q?: string; rashutId?: string }): Promise<{ success: boolean; data?: { id: string; nameHebrew: string; rashutId: string }[]; message?: string }> {
  const backendUrl = `${AppConfig.backendUrl}/api/settlements`;
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.rashutId) query.set('rashutId', params.rashutId);

  try {
    const response = await fetch(`${backendUrl}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getSettlements error:', error);
    return { success: false, message: 'שגיאה בטעינת רשימת יישובים' };
  }
}

export async function getStreets(params: { cityNum?: string; settlementId?: string; settlementName?: string; rashutId?: string; q?: string }): Promise<{ success: boolean; data?: { id: string; nameHebrew: string; rashutId: string }[]; message?: string }> {
  const backendUrl = `${AppConfig.backendUrl}/api/streets`;
  const query = new URLSearchParams();
  if (params.cityNum) query.set('cityNum', params.cityNum);
  if (params.settlementId) query.set('settlementId', params.settlementId);
  if (params.settlementName) query.set('settlementName', params.settlementName);
  if (params.rashutId) query.set('rashutId', params.rashutId);
  if (params.q) query.set('q', params.q);

  try {
    const response = await fetch(`${backendUrl}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getStreets error:', error);
    return { success: false, message: 'שגיאה בטעינת רשימת רחובות' };
  }
}

export async function getAppealReasons(params: { pInfoId: string; tableNum: string }): Promise<{ success: boolean; data?: { key: string; value: string }[]; message?: string }> {
  const backendUrl = `${AppConfig.backendUrl}/api/appeal-reasons`;
  const query = new URLSearchParams();
  query.set('pInfoId', params.pInfoId);
  query.set('tableNum', params.tableNum);

  try {
    const response = await fetch(`${backendUrl}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getAppealReasons error:', error);
    return { success: false, message: 'שגיאה בטעינת סיבות ערעור' };
  }
}

export async function checkPhisiBySubject(
  payerNum: string,
  phisiNum: string,
  subject: string,
  pInfoId: string,
  sugPniya: string,
  sugPniyaB: string
): Promise<{ isValid: boolean; message?: string; data?: any }> {
  const backendUrl = `${AppConfig.backendUrl}/api/soap`;

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:checkPhisiBySubject>
      <lad:pInfoId>${pInfoId}</lad:pInfoId>
      <lad:payerNum>${payerNum}</lad:payerNum>
      <lad:phisiNum>${phisiNum}</lad:phisiNum>
      <lad:subject>${subject}</lad:subject>
      <lad:sugPniya>${sugPniya}</lad:sugPniya>
      <lad:sugPniyaB>${sugPniyaB}</lad:sugPniyaB>
    </lad:checkPhisiBySubject>
  </soap:Body>
</soap:Envelope>`;

  try {
    console.log("Sending SOAP request through backend proxy:", backendUrl);
    console.log("Request body:", soapEnvelope);
    
    const headers = {
      "Content-Type": "application/soap+xml; charset=utf-8",
      "SOAPAction": 'checkPhisiBySubject',
    };
    console.log("Request headers:", headers);
    
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: headers,
      body: soapEnvelope,
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`SOAP request failed: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("Response text:", responseText);

    // Parse the SOAP response - extract XML content
    try {
      // Extract the rcNumber to check success/failure
      const rcNumberMatch = responseText.match(/<rcNumber>(\d+)<\/rcNumber>/);
      const rcMessageMatch = responseText.match(/<rcMessage>(.*?)<\/rcMessage>/);
      
      if (!rcNumberMatch) {
        console.warn("No rcNumber found in response");
        return { isValid: false, message: "תגובה לא תקינה מהשרת" };
      }

      const rcNumber = parseInt(rcNumberMatch[1]);
      const rcMessage = rcMessageMatch ? rcMessageMatch[1] : "";

      console.log("rcNumber:", rcNumber);
      console.log("rcMessage:", rcMessage);

      // Check RcNumber - 1 means success, other values mean failure
      if (rcNumber === 1) {
        return {
          isValid: true,
          message: rcMessage || "השדות תקינים"
        };
      } else {
        return {
          isValid: false,
          message: rcMessage || "השדות לא תקינים"
        };
      }
    } catch (parseError) {
      console.error("Error parsing SOAP response:", parseError);
      return { isValid: false, message: "שגיאה בפרסור תגובת השרת" };
    }
  } catch (error) {
    console.error("SOAP API error:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    return { isValid: false, message: "שגיאה בבדיקת תקינות השדות" };
  }
}

// Function to get required attachments list
export async function getRequiredAttachments(
  payerNum: string,
  phisiNum: string,
  subject: string,
  pInfoId: string,
  nose: string,
  tatNose: string,
  sugPniya: string,
  sugPniyaB: string,
  pattern: number
): Promise<{ success: boolean; attachments?: any[]; message?: string }> {
  const backendUrl = `${AppConfig.backendUrl}/api/soap`;

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:getDocumentsDefinitionAndGormimBTDWS>
      <lad:pInfoId>${pInfoId}</lad:pInfoId>
      <lad:payerNum>${payerNum}</lad:payerNum>
      <lad:phisiNum>${phisiNum}</lad:phisiNum>
      <lad:subject>${subject}</lad:subject>
      <lad:nose>${nose}</lad:nose>
      <lad:tatNose>${tatNose}</lad:tatNose>
      <lad:sugPniya>${sugPniya}</lad:sugPniya>
      <lad:sugPniyaB>${sugPniyaB}</lad:sugPniyaB>
      <lad:pattern>${pattern}</lad:pattern>
    </lad:getDocumentsDefinitionAndGormimBTDWS>
  </soap:Body>
</soap:Envelope>`;

  try {
    console.log("Sending getDocumentsDefinitionAndGormimBTDWS SOAP request:", backendUrl);
    console.log("Request body:", soapEnvelope);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'getDocumentsDefinitionAndGormimBTDWS',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textResponse = await response.text();
    console.log("Attachments SOAP Response:", textResponse);

    try {
      // Parse the XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(textResponse, 'text/xml');
      
      // Extract attachment information from toSubmitDocsDefListTDWS elements
      const attachmentElements = xmlDoc.getElementsByTagName('toSubmitDocsDefListTDWS');
      const attachments = [];
      
      for (let i = 0; i < attachmentElements.length; i++) {
        const element = attachmentElements[i];
        const isn = element.getElementsByTagName('isn')[0]?.textContent || '';
        const fileId = element.getElementsByTagName('fileId')[0]?.textContent || '';
        const fileDescription = element.getElementsByTagName('fileDescription')[0]?.textContent || '';
        const mandatory = element.getElementsByTagName('mandatory')[0]?.textContent || '0';
        const docGroup = element.getElementsByTagName('docGroup')[0]?.textContent || '';
        
        attachments.push({
          id: fileId || isn,
          name: fileDescription,
          required: mandatory === '1',
          docGroup,
          file: null as File | null
        });
      }

      console.log("Parsed attachments:", attachments);

      return {
        success: true,
        attachments
      };
    } catch (parseError) {
      console.error("Error parsing attachments response:", parseError);
      return { 
        success: false, 
        message: "שגיאה בפרסור רשימת הקבצים" 
      };
    }
  } catch (error) {
    console.error("Attachments API error:", error);
    return { 
      success: false, 
      message: "שגיאה בטעינת רשימת הקבצים הנדרשים" 
    };
  }
}

export async function getTavimList(
  pInfoId: string,
  rechev: string,
  zehut: string
): Promise<{ success: boolean; list?: { ezor: string; misparTav: string; sugTav: string }[]; message?: string }> {
  const backendUrl = `${AppConfig.backendUrl}/api/soap`;

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:GetTavimList>
      <lad:pInfoId>${pInfoId}</lad:pInfoId>
      <lad:rechev>${rechev}</lad:rechev>
      <lad:zehut>${zehut}</lad:zehut>
    </lad:GetTavimList>
  </soap:Body>
</soap:Envelope>`;

  try {
    console.log("Sending GetTavimList SOAP request:", backendUrl);
    console.log("Request body:", soapEnvelope);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction": "GetTavimList",
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("GetTavimList SOAP Response:", responseText);

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, "text/xml");

      const rcNumberText = xmlDoc.getElementsByTagName("RcNumber")[0]?.textContent ||
        xmlDoc.getElementsByTagName("rcNumber")[0]?.textContent || "";
      const rcMessageText = xmlDoc.getElementsByTagName("RcMessage")[0]?.textContent ||
        xmlDoc.getElementsByTagName("rcMessage")[0]?.textContent || "";

      if (rcNumberText && rcNumberText !== "1") {
        return { success: false, message: rcMessageText || "שגיאה בקבלת רשימת תווים" };
      }

      const xmlStringNode = xmlDoc.getElementsByTagName("xmlString")[0];
      if (!xmlStringNode) {
        return { success: true, list: [] };
      }

      let items: HTMLCollectionOf<Element> | Element[] = [];

      // If xmlString contains child elements (not escaped), read them directly
      if (xmlStringNode.getElementsByTagName("TavimListResponse").length > 0) {
        items = xmlStringNode.getElementsByTagName("TavimListResponse");
      } else {
        const xmlStringContent = xmlStringNode.textContent || "";
        if (!xmlStringContent.trim()) {
          return { success: true, list: [] };
        }
        const innerDoc = parser.parseFromString(xmlStringContent, "text/xml");
        items = innerDoc.getElementsByTagName("TavimListResponse");
      }
      const list: { ezor: string; misparTav: string; sugTav: string }[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as Element;
        list.push({
          ezor: item.getElementsByTagName("ezor")[0]?.textContent || "",
          misparTav: item.getElementsByTagName("misparTav")[0]?.textContent || "",
          sugTav: item.getElementsByTagName("sugTav")[0]?.textContent || "",
        });
      }

      return { success: true, list };
    } catch (parseError) {
      console.error("Error parsing GetTavimList response:", parseError);
      return { success: false, message: "שגיאה בפרסור רשימת תווים" };
    }
  } catch (error) {
    console.error("GetTavimList API error:", error);
    return { success: false, message: "שגיאה בטעינת רשימת תווים" };
  }
}

// Function to launch process after declaration
export async function launchProcess(
  payerNum: string,
  phisiNum: string,
  subject: string,
  _pInfoId: string,
  nose: string,
  tatNose: string,
  sugPniya: string,
  _sugPniyaB: string,
  pattern: number,
  applicantData: any,
  requestDetailsData: any,
  attachmentsData: any,
  _signature: string,
  templateMeta?: {
    noseName?: string;
    noseDescription?: string;
    tatNoseName?: string;
    tatNoseDescription?: string;
    sugDescription?: string;
    templateDescription?: string;
    zmanTekenSiyom?: string | number;
  }
): Promise<{ success: boolean; message?: string; processId?: string }> {
  const backendUrl = `${AppConfig.backendUrl}/api/soap`;
  const municipality = AppConfig.getMunicipality();

  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const normalizeFileType = (type: string) => {
    const lowered = type.toLowerCase();
    if (lowered === "jpeg") return "jpg";
    return lowered;
  };

  const getFileType = (file: File) => {
    if (file.type && file.type !== "application/octet-stream") {
      const parts = file.type.split("/");
      return normalizeFileType(parts[1] || file.type);
    }

    const nameParts = file.name.split(".");
    const ext = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    return normalizeFileType(ext);
  };

  const getFileNameWithoutExtension = (file: File) => {
    const lastDotIndex = file.name.lastIndexOf(".");
    if (lastDotIndex <= 0) {
      return file.name;
    }
    return file.name.slice(0, lastDotIndex);
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const detectFileTypeFromBase64 = (base64: string) => {
    const trimmed = base64.trim().replace(/\s+/g, "");
    if (trimmed.startsWith("JVBER")) return "pdf";
    if (trimmed.startsWith("/9j/")) return "jpg";
    if (trimmed.startsWith("iVBOR")) return "png";
    if (trimmed.startsWith("R0lGOD")) return "gif";
    return "";
  };

  const filesXml = await (async () => {
    const attachments = attachmentsData?.attachments || [];
    const files = attachments.filter((att: any) => att.file);

    if (files.length === 0) {
      return "";
    }

    const fileBytes = await Promise.all(
      files.map(async (att: any) => {
        const file = att.file as File;
        const fileContent = await fileToBase64(file);
        const detectedType = normalizeFileType(detectFileTypeFromBase64(fileContent));
        const fileType = detectedType || getFileType(file);

        return `
        <lad:fileBytes>
          <lad:fileByte>${fileContent}</lad:fileByte>
          <lad:fileType>${escapeXml(fileType)}</lad:fileType>
          <lad:fileName>${escapeXml(getFileNameWithoutExtension(file))}</lad:fileName>
        </lad:fileBytes>`;
      })
    );

    return fileBytes.join("");
  })();

  // Build items array for the SOAP request
  const legacyTemplate12FieldNames = new Set([
    'isVehicleOwner',
    'cmbSibatIrur',
    'ddlYeshuv',
    'ddlRechov',
    'txtMisparBayit',
    'txtOtBayit',
    'txtMisparDira',
    'txtKnisa',
    'txtTeDoar',
    'txtMikud',
    'pd_ext12_DDLAppael'
  ]);

  const template12FieldNames = new Set([
    'ext12_RBOwnerCar',
    'ext12_RBOwnerCarToPDF',
    'ext12_RBMailDoar',
    'ext12_RBMailDoarToPDF',
    // removed: 'ext12_TextAreaParking' per request
    'ext12_nameRashutToSend',
    'ext12_nameRashutToPDF',
    'ext12_StreetNameToPDF',
    'ext12_TxtPostalCode',
    'ext12_TxtMailbox',
    'ext12_Txtenter',
    'ext12_TxtHomeNum',
    'ext12_TxtDiraNum',
    'ext12_TxtdocGroup12',
    'ext12_txtAppaelChoice',
    'ext12_houseLetter',
    // add sending of the selected code field for legacy pd_ext12_DDLAppael
    'pd_ext12_DDLAppael',
    // new field to send explicit mail/post label for PDF
    'pd_ext12_RBMailDoarToPDF'
  ]);

  const template62FieldNames = new Set([
    'ext62_houseLetter',
    'ext62_RBOwnerCar',
    'ext62_RBOwnerCarToPDF',
    'ext62_TextAreaParking',
    'ext62_DDLAppael',
    'ext62_nameRashutToSend',
    'ext62_TxtPostalCode',
    'ext62_TxtMailbox',
    'ext62_Txtenter',
    'ext62_TxtHomeNum',
    'ext62_TxtDiraNum',
    'ext62_TxtdocGroup12',
    'ext62_txtAppaelChoice',
    'ext62_nameRashutToPDF1',
    'ext62_StreetNameToPDF1',
    'ext62_txtReq',
    'ext62_ValReq',
    'ext62_isSendMailOrSms'
  ]);

  const template63FieldNames = new Set([
    'ext63_houseLetter',
    'ext63_txtTzApplicant',
    'ext63_txtFirstNameApplicant',
    'ext63_txtLastNameApplicant',
    'ext63_txtPhoneNumApplicant',
    'ext63_TextAreaParking',
    'ext63_txtMorePhoneNumApplicant',
    'ext63_txtEmailApplicant',
    'ext63_TxtPostalCode',
    'ext63_TxtMailbox',
    'ext63_Txtenter',
    'ext63_TxtHomeNum',
    'ext63_TxtDiraNum',
    'ext63_txtAppaelChoice',
    'ext63_nameRashutToSend',
    'ext63_nameRashutToPDF',
    'ext63_StreetNameToPDF',
    'ext63_txtCompanyName',
    'ext63_RBPratiToPdf',
    'ext63_isSendMailOrSms',
    'ext63_ValReq',
    'ext63_txtReq'
  ]);

  const template13FieldNames = new Set([
    'ext13_TextAreaPikuach',
    'ext13_nameRashutToSend',
    'ext13_nameRashutToPDF',
    'ext13_StreetNameToPDF',
    'ext13_TxtPostalCode',
    'ext13_TxtMailbox',
    'ext13_Txtenter',
    'ext13_TxtHomeNum',
    'ext13_TxtDiraNum',
    'ext13_settlementCodeClaimed',
    'ext13_streetCodeClaimed',
    'ext13_TxtRes',
    'ext13_ValRes',
    'ext13_houseLetter',
    'ext13_isSendMailOrSms'
  ]);

  const template72FieldNames = new Set([
    'ext72_settlementCodeClaimed',
    'ext72_streetCodeClaimed',
    'ext72_houseLetter',
    'ext72_TextArea',
    'ext72_nameRashutToSend',
    'ext72_TxtPostalCode',
    'ext72_TxtMailbox',
    'ext72_Txtenter',
    'ext72_TxtHomeNum',
    'ext72_TxtDiraNum',
    'ext72_TxtdocGroup12',
    'ext72_txtAppaelChoice',
    'ext72_nameRashutToPDF',
    'ext72_StreetNameToPDF',
    'ext72_isSendMailOrSms'
  ]);

  const template73FieldNames = new Set([
    'ext73_txtTzApplicant',
    'ext73_txtFirstNameApplicant',
    'ext73_txtLastNameApplicant',
    'ext73_txtPhoneNumApplicant',
    'ext73_TextAreaParking',
    'ext73_txtMorePhoneNumApplicant',
    'ext73_txtEmailApplicant',
    'ext73_TxtPostalCode',
    'ext73_TxtMailbox',
    'ext73_Txtenter',
    'ext73_TxtHomeNum',
    'ext73_TxtDiraNum',
    'ext73_txtAppaelChoice',
    'ext73_nameRashutToSend',
    'ext73_nameRashutToPDF',
    'ext73_StreetNameToPDF',
    'ext73_settlementCodeClaimed',
    'ext73_isSendMailOrSms',
    'ext73_streetCodeClaimed'
  ]);

  const template14FieldNames = new Set([
    'ext14_isToshavTxt',
    'ext14_TxtRequesType',
    'ext14_RBTxtSugeTav',
    'ext14_TxtCarOwnership',
    'ext14_TxtProduct',
    'ext14_TxtColor',
    'ext14_TxtNewNum',
    'ext14_txtReq',
    'ext14_TextAreaTavChania',
    'ext14_nameRashutToSend',
    'ext14_nameRashutToPDF',
    'ext14_StreetNameToPDF',
    'ext14_TxtPostalCode',
    'ext14_TxtMailbox',
    'ext14_Txtenter',
    'ext14_TxtHomeNum',
    'ext14_TxtDiraNum',
    'ext14_DDLRequesttype',
    'ext14_ValSugTav',
    'ext14_ValCarOwnership',
    'ext14_ValProduct',
    'ext14_ValColor',
    'ext14_ValReq',
    'ext14_SemelYesuv',
    'ext14_Semel',
    'ext14_ezor',
    'ext14_isSendMailOrSms',
    'ext14_isToshavHutzToPdf',
    'ext14_RBMaiDoar',
    'ext14_RBMailDoarToPDF'
  ]);

  const requestFieldItems = Object.entries(requestDetailsData?.fields || {})
    .filter(([name, value]) => {
      if (name.endsWith('__label')) {
        return false;
      }
      if ((pattern === 12 || pattern === 13 || pattern === 14 || pattern === 62 || pattern === 63 || pattern === 72 || pattern === 73)
        && (template12FieldNames.has(name) || template13FieldNames.has(name) || template14FieldNames.has(name) || template62FieldNames.has(name) || template63FieldNames.has(name) || template72FieldNames.has(name) || template73FieldNames.has(name) || legacyTemplate12FieldNames.has(name))) {
        return false;
      }
      return value !== undefined && value !== null && String(value).trim() !== '';
    })
    .map(([name, value]) =>
      `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`
    );

  const template12Items = pattern === 12
    ? Array.from(template12FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseMailDoarValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          if (typeof rawValue === 'string') {
            const normalized = rawValue.trim();
            if (normalized === 'בדואר') return false;
            if (normalized === 'רק במייל' || normalized === 'במייל' || normalized === 'מייל') return true;
          }
          return null;
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext12_RBOwnerCar': {
              const raw = legacyFields.isVehicleOwner;
              if (raw === true || raw === 'true' || raw === 'yes' || raw === '1') return '1';
              if (raw === false || raw === 'false' || raw === 'no' || raw === '0') return '0';
              const text = getLabel('isVehicleOwner');
              if (text === 'כן') return '1';
              if (text === 'לא') return '0';
              return '';
            }
            case 'ext12_RBOwnerCarToPDF':
              return getLabel('isVehicleOwner') || legacyFields.isVehicleOwner || '';
            case 'ext12_RBMailDoar': {
              const raw = legacyFields.ext12_RBMailDoar ?? legacyFields.ext12_RBMailDoarToPDF;
              const parsed = parseMailDoarValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            case 'ext12_RBMailDoarToPDF': {
              const raw = legacyFields.ext12_RBMailDoar ?? legacyFields.ext12_RBMailDoarToPDF;
              const parsed = parseMailDoarValue(raw);
              if (parsed === true) return 'רק במייל';
              if (parsed === false) return 'בדואר';
              return '';
            }
            case 'pd_ext12_RBMailDoarToPDF': {
              // Send explicit label expected by downstream system.
              // Prefer new select value `pd_ext12_RBMailDoarToPDF`, fall back to legacy fields.
              const raw = legacyFields.pd_ext12_RBMailDoarToPDF ?? legacyFields.ext12_RBMailDoar ?? legacyFields.ext12_RBMailDoarToPDF ?? '';
              const asStr = String(raw).trim();
              const lower = asStr.toLowerCase();
              if (asStr === 'mail' || lower === 'mail' || asStr === 'מייל' || asStr === 'במייל' || asStr === 'רק במייל' || asStr === 'true' || asStr === '1') {
                return 'דואר אלקטרוני';
              }
              if (asStr === 'post' || lower === 'post' || asStr === 'בדואר' || asStr === 'false' || asStr === '0') {
                return 'דואר ישראל';
              }
              // default to electronic
              return 'דואר אלקטרוני';
            }
            // removed ext12_TextAreaParking per request - do not send description textarea
            case 'ext12_txtAppaelChoice':
              // keep existing behavior for backward compatibility (text label)
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext12_TxtdocGroup12':
              return legacyFields.cmbSibatIrur || '';
            case 'pd_ext12_DDLAppael':
              // send the code of the selected option (expected in pd_ext12_DDLAppael)
              return legacyFields.pd_ext12_DDLAppael ?? legacyFields.cmbSibatIrur ?? '';
            case 'ext12_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext12_nameRashutToPDF':
              return getLabel('ddlYeshuv') || legacyFields.ddlYeshuv || '';
            case 'ext12_StreetNameToPDF':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext12_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext12_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext12_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext12_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext12_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext12_houseLetter':
              return legacyFields.txtOtBayit || '';
            default:
              return '';
          }
        })();

        const value = name === 'ext12_RBMailDoar' || name === 'ext12_RBMailDoarToPDF'
          ? (mappedValue ?? valueByNewName ?? '')
          : (valueByNewName ?? mappedValue ?? '');
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const template62Items = pattern === 62
    ? Array.from(template62FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseBooleanValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          return null;
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext62_RBOwnerCar': {
              const raw = legacyFields.isVehicleOwner;
              if (raw === true || raw === 'true' || raw === 'yes' || raw === '1') return '1';
              if (raw === false || raw === 'false' || raw === 'no' || raw === '0') return '0';
              const text = getLabel('isVehicleOwner');
              if (text === 'כן') return '1';
              if (text === 'לא') return '0';
              return '';
            }
            case 'ext62_RBOwnerCarToPDF':
              return getLabel('isVehicleOwner') || legacyFields.isVehicleOwner || '';
            case 'ext62_isSendMailOrSms': {
              const raw = legacyFields.ext62_isSendMailOrSms;
              const parsed = parseBooleanValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            case 'ext62_TextAreaParking':
              return requestDetailsData?.additionalDetails || '';
            case 'ext62_DDLAppael':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext62_txtAppaelChoice':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext62_TxtdocGroup12':
              return legacyFields.cmbSibatIrur || '';
            case 'ext62_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext62_nameRashutToPDF1':
              return municipality.nameHebrew || '';
            case 'ext62_StreetNameToPDF1':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext62_txtReq':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext62_ValReq':
              return legacyFields.cmbSibatIrur || '';
            case 'ext62_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext62_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext62_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext62_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext62_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext62_houseLetter':
              return legacyFields.txtOtBayit || '';
            default:
              return '';
          }
        })();

        const value = valueByNewName ?? mappedValue ?? '';
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const template63Items = pattern === 63
    ? Array.from(template63FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseBooleanValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          return null;
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext63_TextAreaParking':
              return requestDetailsData?.additionalDetails || '';
            case 'ext63_txtAppaelChoice':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext63_ValReq':
              return legacyFields.cmbSibatIrur || '';
            case 'ext63_txtReq':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext63_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext63_nameRashutToPDF':
              return municipality.nameHebrew || '';
            case 'ext63_StreetNameToPDF':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext63_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext63_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext63_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext63_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext63_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext63_houseLetter':
              return legacyFields.txtOtBayit || '';
            case 'ext63_isSendMailOrSms': {
              const raw = legacyFields.ext63_isSendMailOrSms;
              const parsed = parseBooleanValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            default:
              return '';
          }
        })();

        const value = valueByNewName ?? mappedValue ?? '';
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const template13Items = pattern === 13
    ? Array.from(template13FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseBooleanValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          return null;
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext13_TextAreaPikuach':
              return requestDetailsData?.additionalDetails || '';
            case 'ext13_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext13_nameRashutToPDF':
              return getLabel('ddlYeshuv') || legacyFields.ddlYeshuv || '';
            case 'ext13_StreetNameToPDF':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext13_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext13_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext13_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext13_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext13_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext13_houseLetter':
              return legacyFields.txtOtBayit || '';
            case 'ext13_settlementCodeClaimed':
              return legacyFields.ddlYeshuv || '';
            case 'ext13_streetCodeClaimed':
              return legacyFields.ddlRechov || '';
            case 'ext13_TxtRes':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext13_ValRes':
              return legacyFields.cmbSibatIrur || '';
            case 'ext13_isSendMailOrSms': {
              const raw = legacyFields.ext13_isSendMailOrSms;
              const parsed = parseBooleanValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            default:
              return '';
          }
        })();

        const value = valueByNewName ?? mappedValue ?? '';
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const template72Items = pattern === 72
    ? Array.from(template72FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseBooleanValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          return null;
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext72_TextArea':
              return requestDetailsData?.additionalDetails || '';
            case 'ext72_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext72_nameRashutToPDF':
              return municipality.nameHebrew || '';
            case 'ext72_StreetNameToPDF':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext72_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext72_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext72_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext72_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext72_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext72_houseLetter':
              return legacyFields.txtOtBayit || '';
            case 'ext72_settlementCodeClaimed':
              return legacyFields.ddlYeshuv || '';
            case 'ext72_streetCodeClaimed':
              return legacyFields.ddlRechov || '';
            case 'ext72_TxtdocGroup12':
              return legacyFields.cmbSibatIrur || '';
            case 'ext72_txtAppaelChoice':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext72_isSendMailOrSms': {
              const raw = legacyFields.ext72_isSendMailOrSms;
              const parsed = parseBooleanValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            default:
              return '';
          }
        })();

        const value = valueByNewName ?? mappedValue ?? '';
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const template73Items = pattern === 73
    ? Array.from(template73FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseBooleanValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          return null;
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext73_TextAreaParking':
              return requestDetailsData?.additionalDetails || '';
            case 'ext73_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext73_nameRashutToPDF':
              return municipality.nameHebrew || '';
            case 'ext73_StreetNameToPDF':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext73_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext73_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext73_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext73_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext73_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext73_settlementCodeClaimed':
              return legacyFields.ddlYeshuv || '';
            case 'ext73_streetCodeClaimed':
              return legacyFields.ddlRechov || '';
            case 'ext73_txtAppaelChoice':
              return getLabel('cmbSibatIrur') || legacyFields.cmbSibatIrur || '';
            case 'ext73_isSendMailOrSms': {
              const raw = legacyFields.ext73_isSendMailOrSms;
              const parsed = parseBooleanValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            default:
              return '';
          }
        })();

        const value = valueByNewName ?? mappedValue ?? '';
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const template14Items = pattern === 14
    ? Array.from(template14FieldNames).map((name) => {
        const legacyFields = requestDetailsData?.fields || {};
        const valueByNewName = legacyFields[name];
        const getLabel = (fieldName: string) => legacyFields[`${fieldName}__label`] || '';

        const parseBooleanValue = (rawValue: unknown) => {
          if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
          if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
          return null;
        };

        const parseMailChoice = (rawValue: unknown) => {
          if (rawValue === 'mail' || rawValue === '1') return { code: '1', text: 'במייל' };
          if (rawValue === 'post' || rawValue === '0') return { code: '0', text: 'בדואר' };
          if (rawValue === 'במייל') return { code: '1', text: 'במייל' };
          if (rawValue === 'בדואר') return { code: '0', text: 'בדואר' };
          return { code: '', text: '' };
        };

        const mappedValue = (() => {
          switch (name) {
            case 'ext14_isToshavTxt':
              return getLabel('ext14_isToshavTxt') || legacyFields.ext14_isToshavTxt || '';
            case 'ext14_isToshavHutzToPdf':
              return getLabel('ext14_isToshavTxt') || legacyFields.ext14_isToshavTxt || '';
            case 'ext14_TxtRequesType':
              return getLabel('ext14_TxtRequesType') || legacyFields.ext14_TxtRequesType || '';
            case 'ext14_DDLRequesttype':
              return legacyFields.ext14_TxtRequesType || '';
            case 'ext14_RBTxtSugeTav':
              return getLabel('ext14_RBTxtSugeTav') || legacyFields.ext14_RBTxtSugeTav || '';
            case 'ext14_ValSugTav':
              return legacyFields.ext14_RBTxtSugeTav || '';
            case 'ext14_TxtCarOwnership':
              return getLabel('ext14_TxtCarOwnership') || legacyFields.ext14_TxtCarOwnership || '';
            case 'ext14_ValCarOwnership':
              return legacyFields.ext14_TxtCarOwnership || '';
            case 'ext14_TxtProduct':
              return getLabel('ext14_TxtProduct') || legacyFields.ext14_TxtProduct || '';
            case 'ext14_ValProduct':
              return legacyFields.ext14_TxtProduct || '';
            case 'ext14_TxtColor':
              return getLabel('ext14_TxtColor') || legacyFields.ext14_TxtColor || '';
            case 'ext14_ValColor':
              return legacyFields.ext14_TxtColor || '';
            case 'ext14_txtReq':
              return getLabel('ext14_txtReq') || legacyFields.ext14_txtReq || '';
            case 'ext14_ValReq':
              return legacyFields.ext14_txtReq || '';
            case 'ext14_TextAreaTavChania':
              return requestDetailsData?.additionalDetails || '';
            case 'ext14_nameRashutToSend':
              return municipality.longCustomer || '';
            case 'ext14_nameRashutToPDF':
              return getLabel('ddlYeshuv') || legacyFields.ddlYeshuv || '';
            case 'ext14_StreetNameToPDF':
              return getLabel('ddlRechov') || legacyFields.ddlRechov || '';
            case 'ext14_TxtPostalCode':
              return legacyFields.txtMikud || '';
            case 'ext14_TxtMailbox':
              return legacyFields.txtTeDoar || '';
            case 'ext14_Txtenter':
              return legacyFields.txtKnisa || '';
            case 'ext14_TxtHomeNum':
              return legacyFields.txtMisparBayit || '';
            case 'ext14_TxtDiraNum':
              return legacyFields.txtMisparDira || '';
            case 'ext14_SemelYesuv':
              return legacyFields.ddlYeshuv || '';
            case 'ext14_Semel':
              return legacyFields.ddlRechov || '';
            case 'ext14_ezor':
              return legacyFields.ext14_ezor || '';
            case 'ext14_isSendMailOrSms': {
              const raw = legacyFields.ext14_isSendMailOrSms;
              const parsed = parseBooleanValue(raw);
              if (parsed === true) return '1';
              if (parsed === false) return '0';
              return '';
            }
            case 'ext14_RBMaiDoar': {
              const { code } = parseMailChoice(legacyFields.ext14_RBMaiDoar);
              return code;
            }
            case 'ext14_RBMailDoarToPDF': {
              const { text } = parseMailChoice(legacyFields.ext14_RBMaiDoar);
              return text;
            }
            default:
              return '';
          }
        })();

        const value = valueByNewName ?? mappedValue ?? '';
        return `<lad:Item><lad:Name>${name}</lad:Name><lad:Value>${escapeXml(String(value))}</lad:Value></lad:Item>`;
      })
    : [];

  const items = [
    `<lad:Item><lad:Name>txtNameRashut</lad:Name><lad:Value>${escapeXml(municipality.nameHebrew)}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtShortCustomer</lad:Name><lad:Value>${municipality.shortCustomer}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtNameProject</lad:Name><lad:Value>OneClickP</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtLongNumCustomer</lad:Name><lad:Value>${municipality.longCustomer}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtPhiziMandatory</lad:Name><lad:Value>1</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtValueNoseNoseID</lad:Name><lad:Value>${nose}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtNoseName</lad:Name><lad:Value>${escapeXml(templateMeta?.noseName || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtNoseDescription</lad:Name><lad:Value>${escapeXml(templateMeta?.noseDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtTextNoseNoseIDByChoose</lad:Name><lad:Value>${escapeXml(templateMeta?.noseDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtMeshalemMandatory</lad:Name><lad:Value>1</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtCheckDuplicate</lad:Name><lad:Value>1</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtNoseBilling</lad:Name><lad:Value>${subject}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtPattern</lad:Name><lad:Value>${pattern}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtValueTatNoseNoseID</lad:Name><lad:Value>${tatNose}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtTatNoseName</lad:Name><lad:Value>${escapeXml(templateMeta?.tatNoseName || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtTatNoseDescription</lad:Name><lad:Value>${escapeXml(templateMeta?.tatNoseDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtTextTatNoseNoseIDByChoose</lad:Name><lad:Value>${escapeXml(templateMeta?.tatNoseDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtValueSogePnia</lad:Name><lad:Value>${sugPniya}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtSugPniyaDescription</lad:Name><lad:Value>${escapeXml(templateMeta?.sugDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtTeurPattern</lad:Name><lad:Value>${escapeXml(templateMeta?.templateDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtApplicationTypeByChoose</lad:Name><lad:Value>${escapeXml(templateMeta?.templateDescription || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtZmanTekenSiyom</lad:Name><lad:Value>${escapeXml(String(templateMeta?.zmanTekenSiyom ?? ''))}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtNumPay</lad:Name><lad:Value>${payerNum}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtPropertyNum</lad:Name><lad:Value>${phisiNum}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtTzApplicant</lad:Name><lad:Value>${applicantData.idNumber || payerNum}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtFirstNameApplicant</lad:Name><lad:Value>${applicantData.firstName}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtLastNameApplicant</lad:Name><lad:Value>${applicantData.lastName}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtPhoneNumApplicant</lad:Name><lad:Value>${applicantData.mobilePhone}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtMorePhoneNumApplicant</lad:Name><lad:Value>${applicantData.additionalPhone || ''}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtEmailApplicant</lad:Name><lad:Value>${applicantData.email}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>explanation</lad:Name><lad:Value>${escapeXml(requestDetailsData?.additionalDetails || '')}</lad:Value></lad:Item>`,
    `<lad:Item><lad:Name>txtaRemarks</lad:Name><lad:Value>${escapeXml(requestDetailsData?.additionalDetails || '')}</lad:Value></lad:Item>`,
    ...(pattern === 64 && requestDetailsData?.selectedTav
      ? [`<lad:Item><lad:Name>ext64_selectedTav</lad:Name><lad:Value>${escapeXml(String(requestDetailsData.selectedTav))}</lad:Value></lad:Item>`]
      : []),
    ...(pattern === 65 && requestDetailsData?.selectedTav
      ? [`<lad:Item><lad:Name>ext65_selectedTav</lad:Name><lad:Value>${escapeXml(String(requestDetailsData.selectedTav))}</lad:Value></lad:Item>`]
      : []),
    ...requestFieldItems,
    ...template12Items,
    ...template13Items,
    ...template14Items,
    ...template62Items,
    ...template63Items,
    ...template72Items,
    ...template73Items
  ].join('');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:LaunchProcessOneClickP>
      <lad:systemHeader>
        <lad:Customer>${municipality.longCustomer}</lad:Customer>
        <lad:Recipient>${municipality.recipient}</lad:Recipient>
        <lad:Sender>${municipality.sender}</lad:Sender>
        <lad:Token>${municipality.token}</lad:Token>
        <lad:TranId>1</lad:TranId>
        <lad:UserId>${municipality.userId}</lad:UserId>
        <lad:UserPass>${municipality.userPass}</lad:UserPass>
        <lad:Versoin>1.0</lad:Versoin>
      </lad:systemHeader>
      <lad:procName>OneClickP</lad:procName>
      <lad:items>
        ${items}
      </lad:items>
      <lad:files>${filesXml}</lad:files>
    </lad:LaunchProcessOneClickP>
  </soap:Body>
</soap:Envelope>`;

  try {
    console.log("Sending LaunchProcessOneClickP SOAP request:", backendUrl);
    console.log("Request body:", soapEnvelope);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'http://ladpc.APWSProxies/LaunchProcessOneClickP',
        'X-Use-Launch-URL': 'true',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textResponse = await response.text();
    console.log("LaunchProcess SOAP Response:", textResponse);

    try {
      // Parse the XML response
      const pSeqMatch = textResponse.match(/<PSeq>(\d+)<\/PSeq>/);
      const rcTypeMatch = textResponse.match(/<rcType[^>]*>([^<]*)<\/rcType>/);
      const rcNumberMatch = textResponse.match(/<rcNumber[^>]*>([^<]*)<\/rcNumber>/);
      const rcMessageMatch = textResponse.match(/<rcMessage[^>]*>([^<]*)<\/rcMessage>/);
      
      if (!pSeqMatch) {
        return { 
          success: false, 
          message: "תגובה לא תקינה מהשרת - חסר PSeq" 
        };
      }

      const pSeq = pSeqMatch[1];
      const rcType = rcTypeMatch ? rcTypeMatch[1] : "";
      const rcNumber = rcNumberMatch ? rcNumberMatch[1] : "";
      const rcMessage = rcMessageMatch ? rcMessageMatch[1] : "";

      console.log("PSeq:", pSeq);
      console.log("rcType:", rcType);
      console.log("rcNumber:", rcNumber);
      console.log("rcMessage:", rcMessage);

      // Success condition: rcType = "1" and rcNumber is empty
      if (rcType === "1" && (!rcNumber || rcNumber === "")) {
        return {
          success: true,
          message: rcMessage || "התהליך הושק בהצלחה",
          processId: pSeq
        };
      } else {
        return {
          success: false,
          message: rcMessage || "שגיאה בהשקת התהליך"
        };
      }
    } catch (parseError) {
      console.error("Error parsing launch process response:", parseError);
      return { 
        success: false, 
        message: "שגיאה בפרסור תגובת השרת" 
      };
    }
  } catch (error) {
    console.error("LaunchProcess API error:", error);
    return { 
      success: false, 
      message: "שגיאה בהשקת התהליך" 
    };
  }
}
