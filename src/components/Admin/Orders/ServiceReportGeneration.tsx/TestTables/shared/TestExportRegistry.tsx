import React, { createContext, useCallback, useContext, useMemo, useRef } from "react";

type ExportGetter = () => unknown | null | undefined;

interface TestExportRegistryContextValue {
  register: (key: string, getter: ExportGetter) => () => void;
  collect: () => Record<string, unknown>;
}

const TestExportRegistryContext = createContext<TestExportRegistryContextValue | null>(null);

export const TestExportRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const gettersRef = useRef<Map<string, ExportGetter>>(new Map());

  const register = useCallback((key: string, getter: ExportGetter) => {
    gettersRef.current.set(key, getter);
    return () => {
      const current = gettersRef.current.get(key);
      if (current === getter) {
        gettersRef.current.delete(key);
      }
    };
  }, []);

  const collect = useCallback(() => {
    const result: Record<string, unknown> = {};
    gettersRef.current.forEach((getter, key) => {
      try {
        const value = getter();
        if (value != null) {
          result[key] = value;
        }
      } catch (error) {
        console.warn(`Failed to collect export data for "${key}"`, error);
      }
    });
    return result;
  }, []);

  const value = useMemo(() => ({ register, collect }), [register, collect]);

  return (
    <TestExportRegistryContext.Provider value={value}>{children}</TestExportRegistryContext.Provider>
  );
};

export function useTestExportRegistry() {
  return useContext(TestExportRegistryContext);
}

export function useRegisterTestExport(key: string, getter: ExportGetter) {
  const registry = useTestExportRegistry();

  React.useEffect(() => {
    if (!registry) return;
    return registry.register(key, getter);
  }, [registry, key, getter]);
}
