"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResearchAgentProps {
  abstractText: string;
}

interface SearchResult {
  cord_uid: string;
  title: string;
  abstract: string;
}

export function ResearchAgent({ abstractText }: ResearchAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!abstractText.trim()) {
      setError("Please enter some text in the abstract field first.");
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const response = await fetch("https://sagenet.onrender.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          query: abstractText,
          top_k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch similar papers");
      }

      const data = await response.json();
      setResults(Object.values(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-8 text-muted-foreground hover:text-primary"
              onClick={handleSearch}
              aria-label="Find similar research papers"
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Find similar research papers</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Similar Research Papers</DialogTitle>
            <DialogDescription>
              {isLoading
                ? "Searching for similar research papers..."
                : "These papers might be relevant to your research."}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-destructive py-4">{error}</div>
          ) : results.length === 0 ? (
            <div className="py-4">No similar papers found. Try refining your abstract.</div>
          ) : (
            <div className="space-y-4 py-2">
              {results.map((paper: SearchResult) => (
                <div
                  key={paper.cord_uid}
                  className="rounded-lg border p-4 hover:bg-muted/50"
                >
                  <h3 className="font-medium">{paper.title}</h3>
                  <Badge variant="outline" className="mt-2">
                    ID: {paper.cord_uid}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {paper.abstract}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}