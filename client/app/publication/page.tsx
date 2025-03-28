"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Check } from "lucide-react"

export default function PublicationPage() {
  const [selectedPaper, setSelectedPaper] = useState("")
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  // Mock papers data
  const papers = [
    { id: "1", title: "Decentralized Identity Management in Web3 Applications" },
    { id: "2", title: "Comparative Analysis of Consensus Algorithms in Blockchain Networks" },
    { id: "3", title: "Privacy-Preserving Data Sharing Using Zero-Knowledge Proofs" },
  ]

  // Mock journals data
  const journals = [
    { id: "1", name: "Journal of Blockchain Research" },
    { id: "2", name: "Distributed Ledger Technology Review" },
    { id: "3", name: "Cryptography and Network Security Journal" },
    { id: "4", name: "Web3 and Decentralized Systems" },
    { id: "5", name: "Blockchain Economics Review" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmissionStatus("submitting")

    // Simulate submission process
    setTimeout(() => {
      setSubmissionStatus("success")
    }, 2000)
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Publication Application</h1>
        <p className="text-muted-foreground">
          Submit your research paper to academic journals and track the publication process.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Research Paper</CardTitle>
              <CardDescription>Choose one of your research papers to submit for publication.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPaper} onValueChange={setSelectedPaper}>
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer"
                    onClick={() => setSelectedPaper(paper.id)}
                  >
                    <RadioGroupItem value={paper.id} id={`paper-${paper.id}`} />
                    <Label htmlFor={`paper-${paper.id}`} className="flex-1 cursor-pointer font-medium">
                      {paper.title}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publication Details</CardTitle>
              <CardDescription>Provide information about where you want to publish your paper.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="journal">Target Journal</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a journal" />
                  </SelectTrigger>
                  <SelectContent>
                    {journals.map((journal) => (
                      <SelectItem key={journal.id} value={journal.id}>
                        {journal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover-letter">Cover Letter</Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Write a cover letter to the journal editor"
                  className="min-h-[150px]"
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="author-details">Author Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Full Name" />
                  <Input placeholder="Email" type="email" />
                  <Input placeholder="Institution" />
                  <Input placeholder="ORCID ID (optional)" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="co-authors">Co-Authors (if any)</Label>
                <Textarea
                  id="co-authors"
                  placeholder="List co-authors with their names, emails, and institutions"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Preferences</CardTitle>
              <CardDescription>Additional options for your publication submission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Publication Type</Label>
                <RadioGroup defaultValue="regular">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="regular" />
                    <Label htmlFor="regular">Regular Article</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="review" id="review" />
                    <Label htmlFor="review">Review Article</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="short" />
                    <Label htmlFor="short">Short Communication</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Peer Review Preference</Label>
                <RadioGroup defaultValue="double-blind">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="double-blind" id="double-blind" />
                    <Label htmlFor="double-blind">Double-blind</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single-blind" id="single-blind" />
                    <Label htmlFor="single-blind">Single-blind</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="open" id="open" />
                    <Label htmlFor="open">Open Review</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button">
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={!selectedPaper || submissionStatus === "submitting" || submissionStatus === "success"}
              className="min-w-[140px]"
            >
              {submissionStatus === "submitting" ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Submitting...
                </span>
              ) : submissionStatus === "success" ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Submitted
                </span>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

