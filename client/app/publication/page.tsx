"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Check, FileText } from "lucide-react"
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi"
import SageNetCore from "@/contracts/SageNetCore.json"
import ContractAddresses from "@/contracts/DeploymentInfo.json"
import { uploadText } from "@/utils/ipfs"
import { inferStatus, timestampToLocalDateTime } from "@/utils/ utils"

// Interface for paper data
interface Paper {
  id: string
  title: string
  abstract: string
  status: number
  date: string
  ipfsHash: string
}

// Interface for journal data
interface Journal {
  id: string
  name: string
  address: string
}

export default function PublicationPage() {
  const [selectedPaper, setSelectedPaper] = useState("")
  const [selectedJournal, setSelectedJournal] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [authorInstitution, setAuthorInstitution] = useState("")
  const [authorOrcid, setAuthorOrcid] = useState("")
  const [coAuthors, setCoAuthors] = useState("")
  const [publicationType, setPublicationType] = useState("regular")
  const [reviewType, setReviewType] = useState("double-blind")
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [myPapers, setMyPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  // Mock journals data - in a real app, these might come from a contract or API
  const journals: Journal[] = [
    { id: "1", name: "Department of publishing", address: "0xa9190336A4D79bAFc65a6575236f62b6f15370e9" },
    // { id: "2", name: "Distributed Ledger Technology Review", address: "0x2345678901234567890123456789012345678901" },
    // { id: "3", name: "Cryptography and Network Security Journal", address: "0x3456789012345678901234567890123456789012" },
    // { id: "4", name: "Web3 and Decentralized Systems", address: "0x4567890123456789012345678901234567890123" },
    // { id: "5", name: "Blockchain Economics Review", address: "0x5678901234567890123456789012345678901234" },
  ]

  // Get all papers by the current user
  const { data: paperIds, error: paperIdsError } = useReadContract({
    abi: SageNetCore.abi,
    address: ContractAddresses.sageNetCore as `0x${string}`,
    functionName: "getPapersByAuthor",
    args: [address],
  })

  // Get details for each paper
  const {
    data: allPapers,
    isLoading: papersLoading,
    error: multipleReadError,
  } = useReadContracts({
    contracts: (paperIds ? (paperIds as BigInt[]) : []).map((id) => ({
      address: ContractAddresses.sageNetCore as `0x${string}`,
      abi: SageNetCore.abi,
      functionName: "getPaper",
      args: [id],
    })),
  })

  // Process papers data when loaded
  useEffect(() => {
    const processPapers = async () => {
      if (allPapers && allPapers.length) {
        const processedPapers = allPapers.map((paper) => {
          return {
            id: paper.result?._tokenId.toString(),
            title: paper.result?.title,
            abstract: paper.result?.paperAbstract,
            status: paper.result?.status,
            date: timestampToLocalDateTime(Number(paper.result?.timestamp)),
            ipfsHash: paper.result?.ipfsHash
          }
        })

        // Filter papers that are in Draft status (status 0)
        // Only drafts can be submitted for publication
        const eligiblePapers = processedPapers.filter(paper => paper.status === 0)
        setMyPapers(eligiblePapers)
        setIsLoading(false)
      }
    }

    processPapers()
  }, [allPapers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPaper || !selectedJournal) {
      alert("Please select both a paper and a journal")
      return
    }

    setSubmissionStatus("submitting")

    try {
      // Prepare the submission metadata
      const submissionData = {
        paperId: selectedPaper,
        journal: journals.find(j => j.id === selectedJournal)?.name,
        journalAddress: journals.find(j => j.id === selectedJournal)?.address,
        coverLetter,
        authorName,
        authorEmail,
        authorInstitution,
        authorOrcid,
        coAuthors,
        publicationType,
        reviewType,
        timestamp: Date.now()
      }

      // Upload the metadata to IPFS
      const metadataIpfsHash = await uploadText(JSON.stringify(submissionData))

      // Find the journal address from our selected journal
      const journalAddress = journals.find(j => j.id === selectedJournal)?.address

      // Submit to the publisher through the smart contract
      await writeContractAsync({
        abi: SageNetCore.abi,
        address: ContractAddresses.sageNetCore as `0x${string}`,
        functionName: "submitToPublisher",
        args: [BigInt(selectedPaper), journalAddress],
      })

      // In a production app, you might want to store the IPFS hash somewhere
      // For example, you could have another contract method that stores this metadata
      // or you could use an off-chain database

      setSubmissionStatus("success")
    } catch (error) {
      console.error("Error submitting publication application:", error)
      setSubmissionStatus("error")
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p>Loading your papers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Publication Application</h1>
        <p className="text-muted-foreground">
          Submit your research paper to academic journals and track the publication process.
        </p>

        {myPapers.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">No Eligible Papers Found</h2>
                <p className="text-muted-foreground max-w-md">
                  You don't have any papers in draft status that can be submitted for publication. 
                  Please upload a new paper or make sure your papers are in draft status.
                </p>
                <Button href="/upload" variant="default" className="mt-4">
                  Upload New Paper
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Research Paper</CardTitle>
                <CardDescription>Choose one of your research papers to submit for publication.</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPaper} onValueChange={setSelectedPaper}>
                  {myPapers.map((paper) => (
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
                  <Select value={selectedJournal} onValueChange={setSelectedJournal}>
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
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="author-details">Author Details</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      placeholder="Full Name" 
                      value={authorName} 
                      onChange={(e) => setAuthorName(e.target.value)} 
                    />
                    <Input 
                      placeholder="Email" 
                      type="email" 
                      value={authorEmail} 
                      onChange={(e) => setAuthorEmail(e.target.value)} 
                    />
                    <Input 
                      placeholder="Institution" 
                      value={authorInstitution} 
                      onChange={(e) => setAuthorInstitution(e.target.value)} 
                    />
                    <Input 
                      placeholder="ORCID ID (optional)" 
                      value={authorOrcid} 
                      onChange={(e) => setAuthorOrcid(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-authors">Co-Authors (if any)</Label>
                  <Textarea
                    id="co-authors"
                    placeholder="List co-authors with their names, emails, and institutions"
                    className="min-h-[100px]"
                    value={coAuthors}
                    onChange={(e) => setCoAuthors(e.target.value)}
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
                  <RadioGroup value={publicationType} onValueChange={setPublicationType}>
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
                  <RadioGroup value={reviewType} onValueChange={setReviewType}>
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
                disabled={!selectedPaper || !selectedJournal || submissionStatus === "submitting" || submissionStatus === "success"}
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
                ) : submissionStatus === "error" ? (
                  "Try Again"
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}