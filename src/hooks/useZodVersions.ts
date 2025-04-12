import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type ZodVersion = {
  version: string;
  links: {
    self: string;
    entrypoints: string;
    stats: string;
  };
};

type ZodTags = {
  alpha: string;
  beta: string;
  canary: string;
  latest: string;
  next: string;
};

type ZodMetadataResponse = {
  versions: ZodVersion[];
  tags: ZodTags;
};

export const useZodVersions = () => {
  const { data, ...rest } = useQuery<ZodMetadataResponse>({
    queryKey: ["zod-versions"],
    queryFn: async () => {
      const res = await fetch("https://data.jsdelivr.com/v1/packages/npm/zod");
      return await res.json();
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
  });

  const versions = useMemo(() => {
    return data?.versions.filter(({ version }) => {
      if (Object.values(data.tags).includes(version)) {
        return true;
      }
      if (Object.keys(data.tags).some((tag) => version.includes(tag))) {
        return false;
      }
      // 1.x versions are not supported due to outdated api
      if (version.startsWith("1.")) {
        return false;
      }
      return true;
    });
  }, [data]);

  return {
    ...rest,
    data: versions,
    latest: versions?.find(({ version }) => version === data?.tags.latest),
  };
};
