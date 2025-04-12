import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { useZodVersions } from "../hooks/useZodVersions";
import { useQueryState } from "nuqs";

type ZodVersionContextValue = {
  version: string;
  versions: string[];
  versionUrl: string;
  isLoading: boolean;
  setVersion: (version: string) => void;
};

const ZodVersionContext = createContext<ZodVersionContextValue | undefined>(
  undefined
);

export function ZodVersionProvider({ children }: { children: ReactNode }) {
  const { data: versions, latest, isLoading } = useZodVersions();
  const [overriddenVersion, setOverriddenVersion] = useQueryState("version", {
    // defaultValue: latest?.version ?? "3.24.2",
  });

  const version = overriddenVersion ?? latest?.version ?? "3.24.2";

  return (
    <ZodVersionContext.Provider
      value={{
        version,
        isLoading,
        versions: versions?.map((v) => v.version) ?? [],
        versionUrl:
          versions?.find((v) => v.version === version)?.links.self ??
          "https://cdn.jsdelivr.net/npm/zod@3.24.2/+esm",
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
