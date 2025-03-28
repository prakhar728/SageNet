"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

// Mock data for research papers
const papers = [
  {
    id: 1,
    title: "Decentralized Consensus Mechanisms in Blockchain Networks",
    author: "Dr. Alex Johnson",
    tags: ["Blockchain", "Consensus", "Decentralization"],
    status: "Published",
    hasBounty: true,
    date: "2023-11-15",
  },
  {
    id: 2,
    title: "Smart Contract Security Analysis: A Comprehensive Review",
    author: "Prof. Sarah Williams",
    tags: ["Smart Contracts", "Security", "Ethereum"],
    status: "Published",
    hasBounty: false,
    date: "2023-10-28",
  },
  {
    id: 3,
    title: "Zero-Knowledge Proofs in Privacy-Preserving Applications",
    author: "Dr. Michael Chen",
    tags: ["Zero-Knowledge", "Privacy", "Cryptography"],
    status: "Draft",
    hasBounty: true,
    date: "2023-11-02",
  },
  {
    id: 4,
    title: "Scalability Solutions for Next-Generation Blockchain Platforms",
    author: "Prof. Emily Rodriguez",
    tags: ["Scalability", "Layer 2", "Performance"],
    status: "Published",
    hasBounty: true,
    date: "2023-09-19",
  },
  {
    id: 5,
    title: "Tokenomics: Economic Models for Sustainable Blockchain Ecosystems",
    author: "Dr. James Wilson",
    tags: ["Tokenomics", "Economics", "Sustainability"],
    status: "Draft",
    hasBounty: false,
    date: "2023-11-10",
  },
  {
    id: 6,
    title: "Cross-Chain Interoperability: Challenges and Solutions",
    author: "Prof. Lisa Brown",
    tags: ["Interoperability", "Cross-Chain", "Bridges"],
    status: "Published",
    hasBounty: true,
    date: "2023-10-05",
  },
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter papers based on search query
  const filteredPapers = papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Sort papers based on selected option
  const sortedPapers = [...filteredPapers].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else {
      // For "trending", we could implement a more complex algorithm
      // For now, just prioritize papers with bounties
      return b.hasBounty === a.hasBounty ? 0 : b.hasBounty ? 1 : -1
    }
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Explore Research Papers</h1>
        <p className="text-muted-foreground">Discover the latest research papers from our community.</p>

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
                    <CardTitle className="line-clamp-2 text-lg">{paper.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground mb-2">{paper.author}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {paper.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-0">
                  <Badge variant={paper.status === "Published" ? "default" : "outline"}>{paper.status}</Badge>
                  {paper.hasBounty && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    >
                      Bounty Available
                    </Badge>
                  )}
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
                      <h3 className="font-semibold text-lg mb-1">{paper.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{paper.author}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {paper.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                      <Badge variant={paper.status === "Published" ? "default" : "outline"}>{paper.status}</Badge>
                      {paper.hasBounty && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          Bounty Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

