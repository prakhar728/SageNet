"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Download,
  MessageSquare,
  Award,
  Share2,
  Clock,
} from "lucide-react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import SageNetCore from "@/contracts/SageNetCore.json";
import SageNetReview from "@/contracts/SageNetReview.json";
import ContractAddresses from "@/contracts/DeploymentInfo.json";
import {
  inferStatus,
  timestampToLocalDateTime,
  getStatusColor,
} from "@/utils/ utils";

export default function PaperDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [activeTab, setActiveTab] = useState("preview");
  const [comment, setComment] = useState("");
  const [paper, setPaper] = useState<any>(null);
  const [bounty, setBounty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [bountyAmount, setBountyAmount] = useState("");
  const [bountyDays, setBountyDays] = useState(7);
  const [bountyReviewers, setBountyReviewers] = useState(3);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [id, setid] = useState("");

  useEffect(() => {
    const popThis = async () => {
      const { id } = await params;
      setid(id);
    };

    popThis();
  }, []);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: paperData } = useReadContract({
    abi: SageNetCore.abi,
    address: ContractAddresses.sageNetCore as `0x${string}`,
    functionName: "getPaper",
    args: [BigInt(id)],
  });

  const { data: authorCheck } = useReadContract({
    abi: SageNetCore.abi,
    address: ContractAddresses.sageNetCore as `0x${string}`,
    functionName: "isPaperAuthor",
    args: [id, address],
  });

  console.log(authorCheck);
  

  // const authorCheck = paperData?.author == address;


  const { data: bountyData } = useReadContract({
    abi: SageNetReview.abi,
    address: ContractAddresses.sageNetReview as `0x${string}`,
    functionName: "getBountyStatus",
    args: [BigInt(id)],
  });

  const { data: fullBountyData } = useReadContract({
    abi: SageNetReview.abi,
    address: ContractAddresses.sageNetReview as `0x${string}`,
    functionName: "bounties",
    args: [BigInt(id)],
  });

  const { data: reviewIds } = useReadContract({
    abi: SageNetReview.abi,
    address: ContractAddresses.sageNetReview as `0x${string}`,
    functionName: "getReviewsByPaper",
    args: [BigInt(id)],
  });

  useEffect(() => {
    console.log(paperData);

    if (paperData) {
      const {
        ipfsHash,
        author,
        publisher,
        timestamp,
        status,
        title,
        paperAbstract,
        _tokenId,
        versionCount,
      } = paperData as any[];

      // Generate some reasonable tags based on the paper title and abstract
      const allText = (title + " " + paperAbstract).toLowerCase();
      const possibleTags = [
        "Blockchain",
        "Decentralized",
        "Web3",
        "Smart Contracts",
        "DeFi",
        "NFT",
        "Identity",
        "Privacy",
        "Security",
        "Zero-Knowledge",
        "Consensus",
        "Scalability",
        "Governance",
        "Tokenomics",
      ];

      const paperTags = possibleTags
        .filter((tag) => allText.includes(tag.toLowerCase()))
        .slice(0, 4); // Limit to 4 tags

      if (paperTags.length === 0) {
        paperTags.push("Blockchain Research"); // Default tag
      }

      setPaper({
        id: _tokenId.toString(),
        title: title,
        author: `${author.slice(0, 6)}...${author.slice(-4)}`, // Format the address
        authorAddress: author,
        date: timestampToLocalDateTime(Number(timestamp)),
        abstract: paperAbstract,
        ipfsHash: ipfsHash,
        status: Number(status),
        statusText: inferStatus(Number(status)),
        tags: paperTags,
        pdfUrl: `https://gateway.lighthouse.storage/ipfs/${ipfsHash}`,
        versionCount: Number(versionCount),
      });
      setIsLoading(false);
    }
  }, [paperData]);

  useEffect(() => {
    if (bountyData && fullBountyData) {
      const [remaining, amountPerReviewer, isActive, timeRemaining] =
        bountyData as any[];
      const [
        paperId,
        creator,
        amount,
        deadline,
        maxReviewers,
        acceptedReviews,
        active,
      ] = fullBountyData as any[];

      setBounty({
        exists: Number(amount) > 0,
        isActive: isActive,
        remaining: Number(remaining),
        totalReviewers: Number(maxReviewers),
        acceptedReviews: Number(acceptedReviews),
        amountPerReviewer: formatEther(amountPerReviewer),
        totalAmount: formatEther(amount),
        deadline: Number(deadline),
        timeRemaining: Number(timeRemaining),
        creator: creator,
      });
    } else if (authorCheck) {
      setBounty({
        exists: false,
        isActive: false,
      });
    }
  }, [bountyData, fullBountyData, authorCheck]);

  // Set author status
  useEffect(() => {
    if (authorCheck !== undefined) {
      setIsAuthor(Boolean(authorCheck));
    }
  }, [authorCheck]);

  // Fetch review data
  useEffect(() => {
    const fetchReviews = async () => {
      if (!reviewIds || reviewIds.length === 0) return;

      try {
        const reviewsData = await Promise.all(
          (reviewIds as BigInt[]).map(async (id) => {
            const reviewData = await fetch(`/api/reviews/${id}`) // Mock API endpoint
              .then((res) => res.json())
              .catch(() => {
                // Fallback mock data if API doesn't exist
                return {
                  reviewId: id.toString(),
                  reviewer: `0x${Math.random()
                    .toString(16)
                    .substring(2, 10)}...`,
                  timestamp:
                    Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30,
                  status: Math.floor(Math.random() * 3), // 0: Pending, 1: Accepted, 2: Rejected
                  content: `This paper presents interesting findings on ${
                    paper?.title
                  }. The methodology is sound, but could benefit from more detailed explanations. ${
                    Math.random() > 0.5
                      ? "I particularly appreciated the discussion on privacy considerations."
                      : "The conclusions are well supported by the data presented."
                  }`,
                  isReviewer: true,
                };
              });

            return reviewData;
          })
        );

        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    if (reviewIds && paper) {
      fetchReviews();
    }
  }, [reviewIds, paper]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      // This would be integrated with the smart contract in a real implementation
      const mockReviewId = Math.floor(Math.random() * 1000) + 100;

      // For demonstration purposes, let's add the review to our state
      const newReview = {
        reviewId: mockReviewId.toString(),
        reviewer: address || "0x0000",
        timestamp: Date.now(),
        status: 0, // Pending
        content: comment,
        isReviewer: false,
      };

      setReviews([...reviews, newReview]);
      setComment("");

      // In a real implementation, you would call the submitReview function
      // await writeContractAsync({
      //   abi: SageNetReview.abi,
      //   address: ContractAddresses.sageNetReview as `0x${string}`,
      //   functionName: "submitReview",
      //   args: [BigInt(id), "ipfsHash"],
      // })
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const createBounty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bountyAmount || parseFloat(bountyAmount) <= 0) {
      alert("Please enter a valid bounty amount");
      return;
    }

    try {
      setIsLoading(true);

      // Calculate deadline (current time + days in seconds)
      const deadlineInSeconds =
        Math.floor(Date.now() / 1000) + bountyDays * 24 * 60 * 60;

      // In a real implementation, this would call the createBounty function
      console.log("Creating bounty with:", {
        paperId: BigInt(id),
        amount: parseEther(bountyAmount),
        deadline: BigInt(deadlineInSeconds),
        maxReviewers: BigInt(bountyReviewers),
      });

      // Mock successful bounty creation
      // setBounty({
      //   exists: true,
      //   isActive: true,
      //   remaining: bountyReviewers,
      //   totalReviewers: bountyReviewers,
      //   acceptedReviews: 0,
      //   amountPerReviewer: (parseFloat(bountyAmount) / bountyReviewers).toFixed(
      //     4
      //   ),
      //   totalAmount: bountyAmount,
      //   deadline: deadlineInSeconds,
      //   timeRemaining: bountyDays * 24 * 60 * 60,
      //   creator: address,
      // });

      setIsLoading(false);

      console.log(parseEther(bountyAmount));
      console.log(BigInt(id), BigInt(deadlineInSeconds), BigInt(bountyReviewers));
      
      // Actual contract call would be:
      await writeContractAsync({
        abi: SageNetReview.abi,
        address: ContractAddresses.sageNetReview as `0x${string}`,
        functionName: "createBounty",
        args: [BigInt(id), BigInt(deadlineInSeconds), BigInt(bountyReviewers)],
        value: parseEther(bountyAmount)
      })
    } catch (error) {
      console.error("Error creating bounty:", error);
      setIsLoading(false);
    }
  };

  const acceptReview = async (reviewId: string) => {
    try {
      // In a real implementation, this would call the acceptReview function
      console.log("Accepting review:", reviewId);

      // Update the review status in our state
      setReviews(
        reviews.map((review) =>
          review.reviewId === reviewId
            ? { ...review, status: 1 } // Set to Accepted
            : review
        )
      );

      // Update bounty stats
      if (bounty) {
        setBounty({
          ...bounty,
          remaining: bounty.remaining - 1,
          acceptedReviews: bounty.acceptedReviews + 1,
          isActive: bounty.remaining > 1,
        });
      }

      // Actual contract call would be:
      // await writeContractAsync({
      //   abi: SageNetReview.abi,
      //   address: ContractAddresses.sageNetReview as `0x${string}`,
      //   functionName: "acceptReview",
      //   args: [BigInt(reviewId)]
      // })
    } catch (error) {
      console.error("Error accepting review:", error);
    }
  };

  const rejectReview = async (reviewId: string) => {
    try {
      // In a real implementation, this would call the rejectReview function
      console.log("Rejecting review:", reviewId);

      // Update the review status in our state
      setReviews(
        reviews.map((review) =>
          review.reviewId === reviewId
            ? { ...review, status: 2 } // Set to Rejected
            : review
        )
      );

      // Actual contract call would be:
      // await writeContractAsync({
      //   abi: SageNetReview.abi,
      //   address: ContractAddresses.sageNetReview as `0x${string}`,
      //   functionName: "rejectReview",
      //   args: [BigInt(reviewId)]
      // })
    } catch (error) {
      console.error("Error rejecting review:", error);
    }
  };

  const reclaimBounty = async () => {
    try {
      // In a real implementation, this would call the reclaimBounty function
      console.log("Reclaiming bounty");

      // Update bounty status
      setBounty({
        ...bounty,
        isActive: false,
      });

      // Actual contract call would be:
      // await writeContractAsync({
      //   abi: SageNetReview.abi,
      //   address: ContractAddresses.sageNetReview as `0x${string}`,
      //   functionName: "reclaimBounty",
      //   args: [BigInt(id)]
      // })
    } catch (error) {
      console.error("Error reclaiming bounty:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p>Loading paper details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Paper Not Found</h2>
            <p>The requested paper could not be found or does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  // Format timeRemaining to days, hours, minutes
  const formatTimeRemaining = (seconds: number) => {
    if (!seconds) return "Expired";

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap gap-2">
            {paper.tags.map((tag: string) => (
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
            <Badge variant={paper.status === 3 ? "default" : "outline"}>
              {paper.statusText}
            </Badge>
            {bounty?.exists && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              >
                {bounty.totalAmount} ETH Bounty
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

            {/* Bounty Section (Only for authors who haven't created a bounty yet) */}
            {isAuthor && !bounty?.exists && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Bounty</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createBounty} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Bounty Amount (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={bountyAmount}
                        onChange={(e) => setBountyAmount(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="0.5"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Duration (days)
                        </label>
                        <input
                          type="number"
                          value={bountyDays}
                          onChange={(e) =>
                            setBountyDays(parseInt(e.target.value))
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          min="1"
                          max="30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Number of Reviewers
                        </label>
                        <input
                          type="number"
                          value={bountyReviewers}
                          onChange={(e) =>
                            setBountyReviewers(parseInt(e.target.value))
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          min="1"
                          max="10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Create Bounty
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Creating a bounty will incentivize reviewers to provide
                      quality feedback on your paper. You will be able to accept
                      or reject reviews. Accepted reviewers will automatically
                      receive their share of the bounty.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Active Bounty Section */}
            {bounty?.exists && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5 text-amber-500" />
                    Active Bounty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Total Bounty
                      </p>
                      <p className="text-xl font-medium">
                        {bounty.totalAmount} ETH
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Per Reviewer
                      </p>
                      <p className="text-xl font-medium">
                        {bounty.amountPerReviewer} ETH
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Reviewers</p>
                      <p className="text-xl font-medium">
                        {bounty.acceptedReviews} / {bounty.totalReviewers}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Time Remaining
                      </p>
                      <p className="text-xl font-medium flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {formatTimeRemaining(bounty.timeRemaining)}
                      </p>
                    </div>
                  </div>

                  {isAuthor && bounty.timeRemaining <= 0 && bounty.isActive && (
                    <Button
                      onClick={reclaimBounty}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Reclaim Remaining Bounty
                    </Button>
                  )}

                  {!isAuthor && bounty.isActive && (
                    <p className="text-sm mt-4 p-3 bg-muted rounded-md">
                      Submit a thorough review to earn{" "}
                      {bounty.amountPerReviewer} ETH. Your review must be
                      accepted by the paper author to receive the bounty.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">PDF Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center p-4">
                    {/* In a real app, you would embed a PDF viewer here */}
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">PDF Preview</p>
                      <p className="text-sm mb-4">
                        Preview would be embedded here
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(paper.pdfUrl, "_blank")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        View Full PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="mt-4 space-y-6">
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <Textarea
                    placeholder={
                      bounty?.exists && bounty.isActive
                        ? "Submit your review to earn a bounty..."
                        : "Add your comment or review..."
                    }
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!comment.trim()}>
                      {bounty?.exists && bounty.isActive
                        ? "Submit Review"
                        : "Post Comment"}
                    </Button>
                  </div>
                </form>

                <Separator />

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.reviewId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage
                            src={`/api/avatar/${review.reviewer}`}
                            alt={review.reviewer}
                          />
                          <AvatarFallback>
                            {review.reviewer.charAt(2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {review.reviewer}
                            </span>
                            {review.isReviewer && (
                              <Badge variant="outline" className="text-xs">
                                Reviewer
                              </Badge>
                            )}
                            {review.status === 1 && (
                              <Badge
                                variant="default"
                                className="text-xs bg-green-600"
                              >
                                Accepted
                              </Badge>
                            )}
                            {review.status === 2 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-red-500 border-red-200"
                              >
                                Rejected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="pl-10">{review.content}</p>

                      {/* Author controls for pending reviews */}
                      {isAuthor && review.status === 0 && bounty?.isActive && (
                        <div className="pl-10 pt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => acceptReview(review.reviewId)}
                          >
                            Accept Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500"
                            onClick={() => rejectReview(review.reviewId)}
                          >
                            Reject Review
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {reviews.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                      <p>No comments or reviews yet.</p>
                      <p className="text-sm">
                        Be the first to join the discussion.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold">Paper Actions</h2>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(paper.pdfUrl, "_blank")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>

              {bounty?.exists && bounty.isActive && !isAuthor && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("discussion")}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Submit Review for Bounty
                </Button>
              )}

              <Button variant="outline" className="w-full justify-start">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold">Paper Stats</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="text-xl font-medium">v{paper.versionCount}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold">Authorship</h2>
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm">
                  This paper's authorship is verified on the blockchain with a
                  Soul-Bound Token (SBT).
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.open(
                    `https://etherscan.io/token/${ContractAddresses.sageNetCore}?a=${paper.id}`,
                    "_blank"
                  )
                }
              >
                View on Blockchain
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
