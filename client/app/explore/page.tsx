"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Search } from "lucide-react";
import { useAccount, useReadContracts } from "wagmi";
import SageNetCore from "@/contracts/SageNetCore.json";
import ContractAddresses from "@/contracts/DeploymentInfo.json";
import { inferStatus } from "@/utils/ utils";
import Link from "next/link";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [paperCount, setpaperCount] = useState(10);
  const [papers, setpapers] = useState([]);

  // Filter papers based on search query
  const filteredPapers = papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.author.toLowerCase().includes(searchQuery.toLowerCase())
    // || paper.tags.some((tag) =>
    //   tag.toLowerCase().includes(searchQuery.toLowerCase())
    // )
  );

  // Sort papers based on selected option
  const sortedPapers = [...filteredPapers].sort((a, b) => {
    if (sortBy === "newest") {
      return (
        new Date(parseInt(b.date)).getTime() -
        new Date(parseInt(a.date)).getTime()
      );
    } else {
      // For "trending", we could implement a more complex algorithm
      // For now, just prioritize papers with bounties
      return b.hasBounty === a.hasBounty ? 0 : b.hasBounty ? 1 : -1;
    }
  });

  //contract interactions

  const { address } = useAccount();
  const {
    data: allPapers,
    isLoading,
    error: multipleReadError,
  } = SageNetCore
    ? useReadContracts({
        contracts: new Array(10).fill(null).map((_, index) => ({
          address: ContractAddresses.sageNetCore as `0x${string}`,
          abi: SageNetCore.abi,
          functionName: "getPaper",
          args: [index],
        })),
      })
    : { data: undefined, isLoading: false, error: undefined };

  // useEffects to populate data

  useEffect(() => {
    const normalizeThePapers = async () => {
      var temp = allPapers?.map((paper) => {
        if (paper.result) {
          return {
            id: paper.result?._tokenId,
            author: paper.result?.author,
            abstract: paper.result.paperAbstract,
            title: paper.result.title,
            status: paper.result.status,
            date: paper.result.timestamp,
            link: `https://gateway.lighthouse.storage/ipfs/${paper.result.ipfsHash}`,
          };
        }
      });

      temp = temp.filter((t) => t);

      setpapers(temp);
    };
    console.log(allPapers);

    if (allPapers && allPapers.length) normalizeThePapers();
  }, [allPapers]);

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Explore Research Papers</h1>
        <p className="text-muted-foreground">
          Discover the latest research papers from our community.
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search papers, authors, or tags..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedPapers.map((paper) => (
              <Card key={paper.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-2 text-lg">
                      {paper.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    {`${paper.author.slice(0, 4)}...${paper.author.slice(-2)}`}
                  </p>
                  {/* <div className="flex flex-wrap gap-1 mb-3">
                    {paper.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div> */}
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-0">
                  <Badge
                    variant={
                      inferStatus(paper.status) === "Published"
                        ? "default"
                        : "outline"
                    }
                  >
                    {inferStatus(paper.status)}
                  </Badge>
                  {paper.hasBounty && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    >
                      Bounty Available
                    </Badge>
                  )}

                  <Link href={`/papers/${paper.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedPapers.map((paper) => (
              <Card key={paper.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {`${paper.author.slice(0, 4)}...${paper.author.slice(
                          -2
                        )}`}
                      </p>
                      {/* <div className="flex flex-wrap gap-1 mb-3">
                        {paper.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div> */}
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                      <Badge
                        variant={
                          inferStatus(paper.status) === "Published"
                            ? "default"
                            : "outline"
                        }
                      >
                        {inferStatus(paper.status)}
                      </Badge>
                      {paper.hasBounty && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          Bounty Available
                        </Badge>
                      )}

                      <Link href={`/papers/${paper.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
