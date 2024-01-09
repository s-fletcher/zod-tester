import { useState } from "react";
import Editor, { EditorProps } from "@monaco-editor/react";
import { ZodSchema, z } from "zod";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";

const EditorOptions: EditorProps["options"] = {
  renderLineHighlightOnlyWhenFocus: true,
  folding: false,
  minimap: { enabled: false },
  quickSuggestions: { other: false, comments: false, strings: false },
  parameterHints: { enabled: false },
  suggestOnTriggerCharacters: false,
  acceptSuggestionOnEnter: "off",
  tabCompletion: "off",
  wordBasedSuggestions: "off",
  inlineSuggest: { enabled: false },
  contextmenu: false,
};

function App() {
  const [schema, setSchema] = useState("z.object({\n    key: z.string()\n})");
  const [json, setJson] = useState(`{\n    "key": "value"\n}`);
  const [result, setResult] = useState("");
  const [isError, setIsError] = useState(false);

  const onValidate = () => {
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
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-screen-lg mx-auto px-4 p-10 relative">
      <div className="flex gap-4 w-full items-center justify-center">
        <div className="w-full max-w-[600px]">
          <h1 className="font-bold text-lg mb-2">Zod Schema:</h1>
          <Editor
            value={schema}
            onChange={(val) => setSchema(val ?? "")}
            height="400px"
            className="border rounded-md"
            options={EditorOptions}
            defaultLanguage="javascript"
          />
        </div>
        <div className="w-full max-w-[600px]">
          <h1 className="font-bold text-lg mb-2">JSON to Validate:</h1>
          <Editor
            value={json}
            onChange={(val) => setJson(val ?? "")}
            height="400px"
            className="border rounded-md"
            options={EditorOptions}
            defaultLanguage="json"
          />
        </div>
      </div>
      <Button onClick={onValidate} className="w-full" variant="default">
        Validate
      </Button>
      <div>
        <h1 className="font-bold text-lg mb-2">Result:</h1>
        <div
          className={cn(
            "border h-fit whitespace-pre-wrap p-4 font-mono text-sm w-full bg-white rounded-sm",
            isError ? "text-red-500" : "text-black"
          )}
        >
          {result}
        </div>
      </div>
      <a
        href="https://zod.dev/"
        target="_blank"
        rel="noreferrer"
        className="mx-auto text-zinc-400 underline text-sm"
      >
        Zod documentation
      </a>
    </div>
  );
}

export default App;
