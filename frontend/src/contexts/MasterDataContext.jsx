import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCategories } from '../services/categoryService';
import { getUnits } from '../services/unitService';
import { getSuppliers } from '../services/supplierService';

const MasterDataContext = createContext();

export function useMasterData() {
  return useContext(MasterDataContext);
}

export function MasterDataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPromiseRef = useRef(null);

  const fetchAll = useCallback(async (forceRefresh = false) => {
    // If already loaded and not forced, return existing
    if (isLoaded && !forceRefresh) return;
    
    // Deduplicate concurrent requests
    if (fetchPromiseRef.current) {
      await fetchPromiseRef.current;
      return;
    }

    setIsLoading(true);

    fetchPromiseRef.current = Promise.all([
      getCategories().catch(e => { console.error("Failed to fetch categories", e); return { data: [] }; }),
      getUnits().catch(e => { console.error("Failed to fetch units", e); return { data: [] }; }),
      getSuppliers().catch(e => { console.error("Failed to fetch suppliers", e); return { data: [] }; })
    ]).then(([catRes, unitRes, supRes]) => {
      setCategories(catRes?.data || []);
      setUnits(unitRes?.data || []);
      setSuppliers(supRes?.data || []);
      setIsLoaded(true);
    }).finally(() => {
      setIsLoading(false);
      fetchPromiseRef.current = null;
    });

    await fetchPromiseRef.current;
  }, [isLoaded]);

  // Load once on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const value = {
    categories,
    units,
    suppliers,
    isLoaded,
    isLoading,
    refreshAll: () => fetchAll(true)
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}
