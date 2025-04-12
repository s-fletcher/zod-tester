import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import { useZodVersions } from "../hooks/useZodVersions";
import { useQueryState } from "nuqs";

type ZodVersionContextValue = {
  version: string;
  versions: string[];
  isLoading: boolean;
  setVersion: (version: string) => void;
};

export let module: unknown;

const ZodVersionContext = createContext<ZodVersionContextValue | undefined>(
  undefined
);

export function ZodVersionProvider({ children }: { children: ReactNode }) {
  const { data: versions, latest, isLoading } = useZodVersions();
  const [overriddenVersion, setOverriddenVersion] = useQueryState("version");

  const version = overriddenVersion ?? latest?.version ?? "3.24.2";

  useEffect(() => {
    async function main() {
      module = await import(`https://cdn.jsdelivr.net/npm/zod@${version}/+esm`);
    }
    main();
  }, [version]);

  return (
    <ZodVersionContext.Provider
      value={{
        version,
        isLoading,
        versions: versions?.map((v) => v.version) ?? [],
        setVersion: setOverriddenVersion,
      }}
    >
      {children}
    </ZodVersionContext.Provider>
  );
}

export function useZodVersionContext() {
  const context = useContext(ZodVersionContext);
  if (!context) {
    throw new Error(
      "useZodVersionContext must be used within a <ZodVersionProvider />"
    );
  }
  return context;
}
