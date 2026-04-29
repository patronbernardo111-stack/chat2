import React, { useState, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  language: string;
}

const countries: Country[] = [
  { code: 'ES', name: 'España', flag: 'es', dialCode: '+34', language: 'es' },
  { code: 'MX', name: 'México', flag: 'mx', dialCode: '+52', language: 'es' },
  { code: 'AR', name: 'Argentina', flag: 'ar', dialCode: '+54', language: 'es' },
  { code: 'CO', name: 'Colombia', flag: 'co', dialCode: '+57', language: 'es' },
  { code: 'PE', name: 'Perú', flag: 'pe', dialCode: '+51', language: 'es' },
  { code: 'VE', name: 'Venezuela', flag: 've', dialCode: '+58', language: 'es' },
  { code: 'CL', name: 'Chile', flag: 'cl', dialCode: '+56', language: 'es' },
  { code: 'EC', name: 'Ecuador', flag: 'ec', dialCode: '+593', language: 'es' },
  { code: 'GT', name: 'Guatemala', flag: 'gt', dialCode: '+502', language: 'es' },
  { code: 'CU', name: 'Cuba', flag: 'cu', dialCode: '+53', language: 'es' },
  { code: 'US', name: 'United States', flag: 'us', dialCode: '+1', language: 'en' },
  { code: 'GB', name: 'United Kingdom', flag: 'gb', dialCode: '+44', language: 'en' },
  { code: 'FR', name: 'France', flag: 'fr', dialCode: '+33', language: 'fr' },
  { code: 'DE', name: 'Germany', flag: 'de', dialCode: '+49', language: 'de' },
  { code: 'IT', name: 'Italy', flag: 'it', dialCode: '+39', language: 'it' },
  { code: 'BR', name: 'Brasil', flag: 'br', dialCode: '+55', language: 'pt' },
  { code: 'PT', name: 'Portugal', flag: 'pt', dialCode: '+351', language: 'pt' },
  { code: 'JP', name: 'Japan', flag: 'jp', dialCode: '+81', language: 'ja' },
  { code: 'CN', name: 'China', flag: 'cn', dialCode: '+86', language: 'zh' },
  { code: 'IN', name: 'India', flag: 'in', dialCode: '+91', language: 'hi' },
];

interface CountrySelectorProps {
  onCountrySelect: (country: Country) => void;
  selectedCountry?: Country;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ 
  onCountrySelect, 
  selectedCountry = countries[0] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#1f2937',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)'
        }}
      >
        <span style={{ fontSize: '24px' }}>
          {selectedCountry.flag === 'es' ? 'es' : 
           selectedCountry.flag === 'mx' ? 'mx' :
           selectedCountry.flag === 'ar' ? 'ar' :
           selectedCountry.flag === 'co' ? 'co' :
           selectedCountry.flag === 'pe' ? 'pe' :
           selectedCountry.flag === 've' ? 've' :
           selectedCountry.flag === 'cl' ? 'cl' :
           selectedCountry.flag === 'ec' ? 'ec' :
           selectedCountry.flag === 'gt' ? 'gt' :
           selectedCountry.flag === 'cu' ? 'cu' :
           selectedCountry.flag === 'us' ? 'us' :
           selectedCountry.flag === 'gb' ? 'gb' :
           selectedCountry.flag === 'fr' ? 'fr' :
           selectedCountry.flag === 'de' ? 'de' :
           selectedCountry.flag === 'it' ? 'it' :
           selectedCountry.flag === 'br' ? 'br' :
           selectedCountry.flag === 'pt' ? 'pt' :
           selectedCountry.flag === 'jp' ? 'jp' :
           selectedCountry.flag === 'cn' ? 'cn' :
           selectedCountry.flag === 'in' ? 'in' : 'es'}
        </span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: '600', color: '#1f2937' }}>
            {selectedCountry.name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {selectedCountry.dialCode}  -  {selectedCountry.language.toUpperCase()}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <input
              type="text"
              placeholder="Buscar país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1f2937',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '20px' }}>
                  {country.flag === 'es' ? 'es' : 
                   country.flag === 'mx' ? 'mx' :
                   country.flag === 'ar' ? 'ar' :
                   country.flag === 'co' ? 'co' :
                   country.flag === 'pe' ? 'pe' :
                   country.flag === 've' ? 've' :
                   country.flag === 'cl' ? 'cl' :
                   country.flag === 'ec' ? 'ec' :
                   country.flag === 'gt' ? 'gt' :
                   country.flag === 'cu' ? 'cu' :
                   country.flag === 'us' ? 'us' :
                   country.flag === 'gb' ? 'gb' :
                   country.flag === 'fr' ? 'fr' :
                   country.flag === 'de' ? 'de' :
                   country.flag === 'it' ? 'it' :
                   country.flag === 'br' ? 'br' :
                   country.flag === 'pt' ? 'pt' :
                   country.flag === 'jp' ? 'jp' :
                   country.flag === 'cn' ? 'cn' :
                   country.flag === 'in' ? 'in' : 'es'}
                </span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {country.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {country.dialCode}  -  {country.language.toUpperCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
