import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import xml2js from "xml2js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.text({ type: ['text/xml', 'application/soap+xml'], limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

const getCitySoapUrl = process.env.SOAP_SERVICE_URL_GETCITY
  || 'http://10.236.38.151/APWsProxies_asmx/APWsProxies.asmx';

const getCitySoapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:getCity/>
  </soap:Body>
</soap:Envelope>`;

const xmlParser = new xml2js.Parser({
  explicitArray: false,
  tagNameProcessors: [xml2js.processors.stripPrefix],
});

const fetchSettlementsFromSoap = async () => {
  const response = await fetch(getCitySoapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
    },
    body: getCitySoapEnvelope,
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error('getCity SOAP request failed');
    error.details = responseText;
    throw error;
  }

  const parsed = await xmlParser.parseStringPromise(responseText);
  const returnValCity = parsed?.Envelope?.Body?.getCityResponse?.getCityResult?.ReturnValCity || [];
  const items = Array.isArray(returnValCity) ? returnValCity : [returnValCity];

  return items
    .filter(Boolean)
    .map((item) => ({
      id: (item.YESHUV_ID || '').toString().trim(),
      nameHebrew: (item.YESHUV_NAME || '').toString().trim(),
      rashutId: (item.RASHUTID || '').toString().trim(),
    }))
    .filter((item) => item.id || item.nameHebrew);
};

const buildGetStreetByCityEnvelope = (cityNum) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:getStrretByCity>
      <lad:cityNum>${cityNum}</lad:cityNum>
    </lad:getStrretByCity>
  </soap:Body>
</soap:Envelope>`;

const fetchStreetsFromSoap = async (cityNum) => {
  const response = await fetch(getCitySoapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
    },
    body: buildGetStreetByCityEnvelope(cityNum),
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error('getStrretByCity SOAP request failed');
    error.details = responseText;
    throw error;
  }

  const parsed = await xmlParser.parseStringPromise(responseText);
  const returnValStreet = parsed?.Envelope?.Body?.getStrretByCityResponse?.getStrretByCityResult?.ReturnValStreet || [];
  const items = Array.isArray(returnValStreet) ? returnValStreet : [returnValStreet];

  return items
    .filter(Boolean)
    .map((item) => ({
      id: (item.STREET_ID || '').toString().trim(),
      nameHebrew: (item.STREET_NAME || '').toString().trim(),
      rashutId: (item.RASHUTID || '').toString().trim(),
    }))
    .filter((item) => item.id || item.nameHebrew);
};

const buildGetDataTableParkingEnvelope = (pInfoId, tableNum) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:lad="http://ladpc.APWSProxies/">
  <soap:Header/>
  <soap:Body>
    <lad:getDataTableParking>
      <lad:pInfoId>${pInfoId}</lad:pInfoId>
      <lad:tableNum>${tableNum}</lad:tableNum>
    </lad:getDataTableParking>
  </soap:Body>
</soap:Envelope>`;

const fetchAppealReasonsFromSoap = async (pInfoId, tableNum) => {
  const response = await fetch(getCitySoapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
    },
    body: buildGetDataTableParkingEnvelope(pInfoId, tableNum),
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error('getDataTableParking SOAP request failed');
    error.details = responseText;
    throw error;
  }

  const parsed = await xmlParser.parseStringPromise(responseText);
  const result = parsed?.Envelope?.Body?.getDataTableParkingResponse?.getDataTableParkingResult || [];
  const items = Array.isArray(result?.ItemArnona) ? result.ItemArnona : (result?.ItemArnona ? [result.ItemArnona] : []);

  return items
    .filter(Boolean)
    .map((item) => ({
      key: (item.Key || '').toString().trim(),
      value: (item.Value || '').toString().trim(),
    }))
    .filter((item) => item.key || item.value);
};

app.get("/health", (req, res) => {
  res.send("OK");
});

// Settlements API (SOAP getCity)
app.get("/api/settlements", async (req, res) => {
  try {
    const query = (req.query.q || '').toString().trim();
    const rashutId = (req.query.rashutId || '').toString().trim();

    let settlements = await fetchSettlementsFromSoap();

    if (rashutId) {
      settlements = settlements.filter((s) => s.rashutId === rashutId);
    }

    if (query) {
      const normalized = query.toLowerCase();
      settlements = settlements.filter((s) =>
        s.id.toLowerCase().includes(normalized) ||
        s.nameHebrew.toLowerCase().includes(normalized)
      );
    }

    return res.json({ success: true, data: settlements });
  } catch (error) {
    console.error('getCity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load settlements',
      details: error.details || error.message,
    });
  }
});

// Streets API (SOAP getStrretByCity)
app.get("/api/streets", async (req, res) => {
  try {
    const settlementId = (req.query.settlementId || '').toString().trim();
    const cityNum = (req.query.cityNum || '').toString().trim();
    const settlementName = (req.query.settlementName || '').toString().trim();
    const rashutId = (req.query.rashutId || '').toString().trim();
    const query = (req.query.q || '').toString().trim();

    let resolvedCityNum = cityNum || settlementId || rashutId;
    if (!resolvedCityNum && settlementName) {
      const settlements = await fetchSettlementsFromSoap();
      const found = settlements.find((s) => s.nameHebrew === settlementName);
      resolvedCityNum = found?.id || '';
    }

    if (!resolvedCityNum) {
      return res.status(400).json({
        success: false,
        message: 'Missing settlementId/cityNum or settlementName'
      });
    }

    let streets = await fetchStreetsFromSoap(resolvedCityNum);

    if (rashutId) {
      streets = streets.filter((s) => s.rashutId === rashutId);
    }

    if (query) {
      const normalized = query.toLowerCase();
      streets = streets.filter((s) =>
        s.id.toLowerCase().includes(normalized) ||
        s.nameHebrew.toLowerCase().includes(normalized)
      );
    }

    return res.json({ success: true, data: streets });
  } catch (error) {
    console.error('streets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load streets',
      details: error.details || error.message,
    });
  }
});

// Appeal reasons API (SOAP getDataTableParking)
app.get('/api/appeal-reasons', async (req, res) => {
  try {
    const pInfoId = (req.query.pInfoId || '').toString().trim();
    const tableNum = (req.query.tableNum || '').toString().trim();

    if (!pInfoId || !tableNum) {
      return res.status(400).json({
        success: false,
        message: 'Missing pInfoId or tableNum'
      });
    }

    const reasons = await fetchAppealReasonsFromSoap(pInfoId, tableNum);
    return res.json({ success: true, data: reasons });
  } catch (error) {
    console.error('appeal reasons error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load appeal reasons',
      details: error.details || error.message,
    });
  }
});

// SOAP Proxy endpoint
app.post("/api/soap", async (req, res) => {
  try {
    console.log('=== SOAP REQUEST ===');
    console.log('Body type:', typeof req.body);
    console.log('Body:', req.body ? (typeof req.body === 'string' ? req.body.substring(0, 200) + '...' : JSON.stringify(req.body).substring(0, 200)) : 'EMPTY');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // Additional debug: if SOAP body contains template12 mail fields, log them explicitly
    // try {
    //   const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    //   if (bodyStr.includes('ext12_RBMailDoarToPDF') || bodyStr.includes('ext12_RBMailDoar')) {
    //     const matchPDF = bodyStr.match(/<lad:Name>ext12_RBMailDoarToPDF<\/lad:Name>\s*<lad:Value>([^<]*)<\/lad:Value>/);
    //     const matchFlag = bodyStr.match(/<lad:Name>ext12_RBMailDoar<\/lad:Name>\s*<lad:Value>([^<]*)<\/lad:Value>/);
    //     console.log('Detected template12 mail fields in SOAP body:');
    //     if (matchPDF) console.log('ext12_RBMailDoarToPDF =', matchPDF[1]);
    //     if (matchFlag) console.log('ext12_RBMailDoar =', matchFlag[1]);
    //   }
    // } catch (err) {
    //   console.warn('Error parsing SOAP body for debug fields:', err);
    // }
    
    // Check if client specified a custom SOAP endpoint
    const useAlternateUrl = req.headers['x-use-launch-url'] === 'true';
    console.log('x-use-launch-url header:', req.headers['x-use-launch-url']);
    console.log('useAlternateUrl:', useAlternateUrl);
    const soapUrl = useAlternateUrl 
      ? process.env.SOAP_SERVICE_URL_LAUNCH 
      : process.env.SOAP_SERVICE_URL;
    
    if (!soapUrl) {
      return res.status(500).json({ error: 'SOAP_SERVICE_URL not configured' });
    }
    
    console.log('Using SOAP URL:', soapUrl);
    
    // Build the proper SOAP headers
    const soapAction = req.headers['soapaction'] || req.headers['SOAPAction'];
    
    const forwardHeaders = {};
    
    if (soapAction) {
      // For SOAP 1.2: send action both ways to ensure compatibility
      forwardHeaders['Content-Type'] = `application/soap+xml; charset=utf-8; action="${soapAction}"`;
      forwardHeaders['SOAPAction'] = `"${soapAction}"`;
      console.log('SOAP Action in Content-Type:', forwardHeaders['Content-Type']);
      console.log('SOAP Action header:', forwardHeaders['SOAPAction']);
    } else {
      forwardHeaders['Content-Type'] = 'application/soap+xml; charset=utf-8';
      console.log('WARNING: No SOAPAction header found in request!');
      console.log('Available headers:', Object.keys(req.headers));
    }
    
    console.log('Forward Headers:', JSON.stringify(forwardHeaders, null, 2));
    console.log('Forwarding to:', soapUrl);
    
    const response = await fetch(soapUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: req.body,
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response length:', responseText.length);
    
    if (!response.ok) {
      console.log('ERROR Response:', responseText);
    }
    
    res.set('Content-Type', 'text/xml');
    res.send(responseText);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Launch Process endpoint - special format for LaunchProcessOneClickP
app.post("/api/launch", async (req, res) => {
  try {
    console.log('=== LAUNCH PROCESS REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const launchUrl = process.env.SOAP_SERVICE_URL_LAUNCH;
    
    if (!launchUrl) {
      return res.status(500).json({ error: 'SOAP_SERVICE_URL_LAUNCH not configured' });
    }
    
    console.log('Forwarding to:', launchUrl);
    
    const response = await fetch(launchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (!response.ok) {
      console.log('ERROR Response:', responseText);
    }
    
    res.set('Content-Type', 'application/json');
    res.send(responseText);
  } catch (error) {
    console.error('Launch process error:', error);
    res.status(500).json({ error: 'Launch process failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
