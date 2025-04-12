"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { MdKeyboardArrowDown, MdCheck } from "react-icons/md";
import { useZodVersionContext } from "../contexts/ZodVersionContext";
import { PopoverProps } from "@radix-ui/react-popover";
import { Skeleton } from "./ui/skeleton";

export function ZodVersionSelector(props: PopoverProps) {
  const { version, versions, isLoading, setVersion } = useZodVersionContext();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] justify-between"
        >
          {isLoading ? (
            <Skeleton className="w-[100px] h-2" />
          ) : version ? (
            versions.find((v) => v === version)
          ) : (
            "Select version..."
          )}
          <MdKeyboardArrowDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent forceMount className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search version..." />
          <CommandList>
            <CommandEmpty>No versions found.</CommandEmpty>
            <CommandGroup>
              {versions.map((v) => (
                <CommandItem
                  key={v}
                  value={v}
                  onSelect={(currentValue) => {
                    setVersion(currentValue === version ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <MdCheck
                    className={cn(
                      "mr-2 h-4 w-4",
                      version === v ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {v}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
