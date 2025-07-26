import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import { useZodVersions } from "../hooks/useZodVersions";
import { useQueryState } from "nuqs";
import { useQueries, useQuery } from "@tanstack/react-query";

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

type FileMeta = {
  name: string;
  files?: FileMeta[];
};

const getTypeFilePaths = (files: FileMeta[], path = ""): string[] => {
  return files.flatMap((file) => {
    if (file.name.endsWith(".d.ts")) return [`${path}${file.name}`];
    if (file.files) return getTypeFilePaths(file.files, `${path}${file.name}/`);
    return [];
  });
};

const cdnUrl = "https://cdn.jsdelivr.net";
const dataUrl = "https://data.jsdelivr.com";

export function ZodVersionProvider({ children }: { children: ReactNode }) {
  const { data: versions, latest, isLoading } = useZodVersions();
  const [overriddenVersion, setOverriddenVersion] = useQueryState("version");
  const version = overriddenVersion ?? latest?.version ?? "3.24.2";
  const { data: declarationPaths } = useQuery({
    queryKey: ["zod-declaration-paths", version],
    queryFn: async () => {
      const res = await fetch(`${dataUrl}/v1/packages/npm/zod@${version}`);
      const files: FileMeta[] = (await res.json()).files;
      return getTypeFilePaths(files);
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
  });

  const declarations = useQueries({
    queries:
      declarationPaths?.map((path) => ({
        queryKey: ["zod-declaration", version, path],
        queryFn: async () => {
          const res = await fetch(`${cdnUrl}/npm/zod@${version}/${path}`);
          return await res.text();
        },
        staleTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        refetchOnMount: false,
      })) ?? [],
    combine: (results) => {
      return results
        .map(({ data }) => data)
        .filter(Boolean)
        .join("\n");
    },
  });

  useEffect(() => {
    async function main() {
      module = await import(`${cdnUrl}/npm/zod@${version}/+esm`);
    }
    main();
  }, [version]);

  return (
    <ZodVersionContext.Provider
      value={{
        version,
        isLoading,
        declarations,
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
