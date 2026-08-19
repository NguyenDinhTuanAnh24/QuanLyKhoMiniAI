import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBranding } from '../services/settingService';
import { isAuthenticated } from '../services/authService';

const BrandingContext = createContext();

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    storeName: 'Cửa hàng',
    logoUrl: null,
  });
  const [loading, setLoading] = useState(true);

  const loadBranding = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await getBranding();
      if (response && response.success && response.data) {
        setBranding({
          storeName: response.data.store_name || 'Cửa hàng',
          logoUrl: response.data.store_logo_url || null,
        });
      }
    } catch (error) {
      if (error.code !== 'ERR_NETWORK' && !error.message?.includes('Network Error')) {
        console.error('Lỗi khi tải branding:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  useEffect(() => {
    const name = branding?.storeName?.trim();
    document.title = name && name !== 'Cửa hàng' ? name : 'Smart Retail Inventory AI';

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (branding?.logoUrl) {
      const version = branding.updatedAt || '1';
      link.href = `${branding.logoUrl}${branding.logoUrl.includes('?') ? '&' : '?'}v=${version}`;
    } else {
      link.href = '/favicon.svg';
    }
  }, [branding?.storeName, branding?.logoUrl, branding?.updatedAt]);

  return (
    <BrandingContext.Provider value={{ branding, setBranding, loading, refreshBranding: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
