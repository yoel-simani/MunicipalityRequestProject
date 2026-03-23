import React from 'react';
import { AppConfig } from '../config/appConfig';

export default function MunicipalityLogo() {
  const municipality = AppConfig.getMunicipality();
  
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      direction: 'rtl'
    }}>
      <img 
        src={municipality.logo} 
        alt={municipality.nameHebrew}
        style={{
          maxWidth: '200px',
          maxHeight: '100px',
          objectFit: 'contain',
          backgroundColor: '#fff'
        }}
        onError={(e) => {
          // Fallback to default logo if image fails to load
          (e.target as HTMLImageElement).src = '/logos/default.png';
        }}
      />
      <h2 style={{ 
        marginTop: '10px',
        fontSize: '24px',
        color: '#333'
      }}>
        {municipality.nameHebrew}
      </h2>
    </div>
  );
}
