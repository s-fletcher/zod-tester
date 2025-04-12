import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import { useZodVersions } from "../hooks/useZodVersions";
import { useQueryState } from "nuqs";
import { useQuery } from "@tanstack/react-query";

type ZodVersionContextValue = {
  version: string;
  versions: string[];
  declarations: string;
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
  const { data: declarations } = useQuery({
    queryKey: ["zod-declaration", version],
    queryFn: async () => {
      // 4.x versions export types differently
      if (version.startsWith("4.")) {
        const res = await fetch(
          `https://cdn.jsdelivr.net/npm/zod@${version}/dist/esm/schemas.d.ts`
        );
        return await res.text();
      }
      const res = await fetch(
        `https://cdn.jsdelivr.net/npm/zod@${version}/lib/types.d.ts`
      );
      return await res.text();
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
  });

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
        declarations: declarations ?? "",
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
