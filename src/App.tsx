import { useCallback, useEffect, useMemo, useState } from "react";
import Editor, { EditorProps, loader, Monaco } from "@monaco-editor/react";
import { ZodSchema, z } from "zod";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useQueryState } from "nuqs";
import LZString from "lz-string";
import { useToast } from "./components/ui/use-toast";
import { zodDeclaration } from "./lib/zod-declaration";

const EditorOptions: EditorProps["options"] = {
  renderLineHighlightOnlyWhenFocus: true,
  folding: false,
  minimap: { enabled: false },
  contextmenu: false,
  formatOnPaste: true,
  formatOnType: true,
  scrollBeyondLastLine: false,
  automaticLayout: true,
};

type Theme = "dark" | "light" | "system";

const defaultSchema = "z.object({\n    key: z.string()\n})";
const defaultJson = `{\n    "key": "value"\n}`;
const defaultResult = "";

const parse = (value: string) => LZString.decompressFromBase64(value);
const serialize = (value: string) => LZString.compressToBase64(value);

function App() {
  const [instance, setInstance] = useState<Monaco>();
  const [schema, setSchema] = useQueryState("schema", {
    parse,
    serialize,
    defaultValue: defaultSchema,
  });
  const [json, setJson] = useQueryState("json", {
    parse,
    serialize,
    defaultValue: defaultJson,
  });
  const [result, setResult] = useQueryState("result", {
    parse,
    serialize,
    defaultValue: defaultResult,
  });
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("ui-theme") as Theme) || "system"
  );
  const { toast } = useToast();

  const isDark = useMemo(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      return systemTheme === "dark";
    }
    return theme === "dark";
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    loader.init().then((monaco) => {
      setInstance(monaco);
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
      });
      monaco.languages.typescript.typescriptDefaults.setExtraLibs([
        {
          content: `declare namespace z{${zodDeclaration}}`,
        },
      ]);
    });
  }, []);

  const onValidate = useCallback(() => {
    try {
      // eslint-disable-next-line no-new-func
      const fun = new Function(
        "z",
        "zod",
        `"use strict";return (${
          schema.trim().endsWith(";")
            ? schema.trim().slice(0, -1)
            : schema.trim()
        })`
      );
      const zodSchema = fun(z, z);
      if (zodSchema instanceof ZodSchema) {
        const result = zodSchema.safeParse(JSON.parse(json));
        if (!result.success) {
          setIsError(true);
          setResult(JSON.stringify(result.error, undefined, 4));
          return;
        }
        setResult(JSON.stringify(result.data, undefined, 4));
        setIsError(false);
      } else {
        setIsError(true);
        setResult("Input is not an instance of `ZodSchema`");
      }
    } catch (error) {
      setIsError(true);
      setResult(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    }
  }, [schema, json, setResult]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        instance?.editor.getEditors().forEach((editor) => {
          editor.getAction("editor.action.formatDocument")?.run();
        });
        onValidate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [instance, onValidate]);

  return (
    <div
      className={cn(
        "w-full h-full bg-background min-h-screen",
        isDark ? "dark" : ""
      )}
    >
      <div className="flex flex-col gap-8 w-full max-w-screen-lg mx-auto px-4 p-10 relative">
        <div className="flex flex-col sm:flex-row gap-4 w-full items-center justify-center  [&_.monaco-editor]:absolute">
          <div className="w-full">
            <h1 className="font-bold text-lg mb-2">Zod Schema:</h1>
            <Editor
              value={schema}
              onChange={(val) => setSchema(val ?? "")}
              height="400px"
              className="border rounded-md"
              options={EditorOptions}
              theme={isDark ? "vs-dark" : "light"}
              defaultLanguage="typescript"
            />
          </div>
          <div className="w-full">
            <h1 className="font-bold text-lg mb-2">JSON to Validate:</h1>
            <Editor
              value={json}
              onChange={(val) => setJson(val ?? "")}
              height="400px"
              className="border rounded-md"
              options={EditorOptions}
              theme={isDark ? "vs-dark" : "light"}
              defaultLanguage="json"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button onClick={onValidate} className="w-full" variant="default">
              Validate
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
                <svg
                  className="shrink-0 size-3"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path>
                </svg>
                <span>S</span>
              </kbd>
            </Button>
            <Button
              onClick={() => {
                const newTheme = isDark ? "light" : "dark";
                localStorage.setItem("ui-theme", newTheme);
                setTheme(newTheme);
              }}
            >
              {isDark ? <MdLightMode /> : <MdDarkMode />}
            </Button>
          </div>
          <div className="flex flex-row flex-grow gap-2">
            <Button
              variant="outline"
              className="flex-grow"
              onClick={() => {
                setSchema(defaultSchema);
                setJson(defaultJson);
                setResult(defaultResult);
              }}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              className="flex-grow"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  description: "Link copied to clipboard",
                  duration: 3000,
                });
              }}
            >
              Share
            </Button>
          </div>
        </div>
        <div>
          <h1 className="font-bold text-lg mb-2">Result:</h1>
          <div
            className={cn(
              "border h-fit whitespace-pre-wrap p-4 font-mono text-sm w-full bg-white rounded-sm",
              isDark ? "bg-[rgb(30_30_30)] text-white" : "",
              isError ? "text-red-500" : ""
            )}
          >
            {result}
          </div>
        </div>
        <div className="mx-auto flex flex-col gap-2">
          <a
            href="https://zod.dev/"
            target="_blank"
            rel="noreferrer"
            className="mx-auto text-zinc-400 underline text-sm"
          >
            Zod documentation
          </a>
          <a
            href="https://github.com/s-fletcher/zod-tester/"
            target="_blank"
            rel="noreferrer"
            className="mx-auto text-zinc-400 underline text-sm"
          >
            Github repository
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
