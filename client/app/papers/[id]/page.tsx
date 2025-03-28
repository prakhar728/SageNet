"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, MessageSquare, Award, Share2 } from "lucide-react"

export default function PaperDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("preview")
  const [comment, setComment] = useState("")

  // Mock paper data
  const paper = {
    id: params.id,
    title: "Decentralized Identity Management in Web3 Applications",
    author: "Dr. Michael Chen",
    date: "October 15, 2023",
    abstract:
      "This paper explores the implementation of decentralized identity systems in Web3 applications. We analyze various approaches to self-sovereign identity and propose a framework for secure, privacy-preserving identity management that leverages blockchain technology and zero-knowledge proofs.",
    tags: ["Decentralized Identity", "Web3", "Zero-Knowledge Proofs", "Privacy"],
    status: "Published",
    hasBounty: true,
    bountyAmount: 50,
    pdfUrl: "#",
    views: 245,
    citations: 12,
  }

  // Mock comments
  const comments = [
    {
      id: 1,
      author: "Prof. Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "November 2, 2023",
      content:
        "Excellent analysis of the current challenges in decentralized identity systems. I particularly appreciated the discussion on privacy considerations and the proposed framework.",
      isReviewer: true,
    },
    {
      id: 2,
      author: "Dr. Robert Lee",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "November 5, 2023",
      content:
        "The methodology section could benefit from more detailed explanations of the cryptographic primitives used. Otherwise, a solid contribution to the field.",
      isReviewer: true,
    },
  ]

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the comment to an API
    setComment("")
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap gap-2">
            {paper.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold">{paper.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{paper.author}</span>
            <span>•</span>
            <span>{paper.date}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={paper.status === "Published" ? "default" : "outline"}>{paper.status}</Badge>
            {paper.hasBounty && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {paper.bountyAmount} TestToken Bounty
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-muted/30 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Abstract</h2>
              <p>{paper.abstract}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">PDF Preview</TabsTrigger>
                <TabsTrigger value="discussion">Discussion ({comments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">PDF Preview</p>
                      <p className="text-sm">The PDF viewer would be embedded here</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="mt-4 space-y-6">
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <Textarea
                    placeholder="Add your comment or review..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!comment.trim()}>
                      Post Comment
                    </Button>
                  </div>
                </form>

                <Separator />

                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={comment.avatar} alt={comment.author} />
                          <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author}</span>
                            {comment.isReviewer && (
                              <Badge variant="outline" className="text-xs">
                                Reviewer
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{comment.date}</p>
                        </div>
                      </div>
                      <p className="pl-10">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold">Paper Actions</h2>

              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>

              {paper.hasBounty && (
                <Button variant="outline" className="w-full justify-start">
                  <Award className="mr-2 h-4 w-4" />
                  Submit Review for Bounty
                </Button>
              )}

              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Discuss
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold">Paper Stats</h2>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-xl font-medium">{paper.views}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Citations</p>
                  <p className="text-xl font-medium">{paper.citations}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold">Authorship</h2>
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm">
                  This paper's authorship is verified on the blockchain with a Soul-Bound Token (SBT).
                </p>
              </div>
              <Button variant="outline" className="w-full">
                View on Blockchain
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

