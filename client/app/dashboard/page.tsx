"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import SageNetCore from "@/contracts/SageNetCore.json";
import SageNetReview from "@/contracts/SageNetReview.json";
import ContractAddresses from "@/contracts/DeploymentInfo.json";
import { useEffect, useState } from "react";
import { myPaper } from "@/utils/PaperFormTypes";
import {
  getStatusColor,
  inferStatus,
  timestampToLocalDateTime,
} from "@/utils/ utils";

// Interface for publication data
interface Publication {
  id: string;
  title: string;
  journal: string;
  submittedDate: string;
  status: string;
  progress: number;
}

// Interface for contribution data
interface Contribution {
  id: string;
  paperId: string;
  type: string;
  date: string;
  reward: number;
}

export default function DashboardPage() {
  const [myPapers, setMyPapers] = useState<myPaper[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [incomingPublications, setIncomingPublications] = useState<
    Publication[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Contract interactions
  const { address } = useAccount();

  // Get paper IDs for the current user (as author)
  const { data: paperIds, error } = useReadContract({
    abi: SageNetCore.abi,
    address: ContractAddresses.sageNetCore as `0x${string}`,
    functionName: "getPapersByAuthor",
    args: [address],
  });

  // Get paper details for each ID
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
  });

  const { data: latestPaperId } = useReadContract({
      abi: SageNetCore.abi,
      address: ContractAddresses.sageNetCore as `0x${string}`,
      functionName: "getLatestPaperId",
      args: [],
    });

  // Get all paper in the db
  const { data: allOfPapers } = SageNetCore
    ? useReadContracts({
        contracts: (parseInt(latestPaperId) ? new Array(parseInt(latestPaperId)) : []).fill(null).map((_, index) => ({
          address: ContractAddresses.sageNetCore as `0x${string}`,
          abi: SageNetCore.abi,
          functionName: "getPaper",
          args: [index],
        })),
      })
    : { data: undefined };

  // Get review IDs for the current user (as reviewer)
  const { data: reviewIds } = useReadContract({
    abi: SageNetReview.abi,
    address: ContractAddresses.sageNetReview as `0x${string}`,
    functionName: "getReviewsByReviewer",
    args: [address],
  });

  // Get details for each review
  const { data: allReviews } = useReadContracts({
    contracts: (reviewIds ? (reviewIds as BigInt[]) : []).map((id) => ({
      address: ContractAddresses.sageNetReview as `0x${string}`,
      abi: SageNetReview.abi,
      functionName: "getReview",
      args: [id],
    })),
  });

  // Process paper data when loaded
  useEffect(() => {
    const normalizeThePapers = async () => {
      if (!allPapers || !allPapers.length) return;

      const temp = allPapers.map((paper) => {
        return {
          id: paper.result?._tokenId,
          abstract: paper.result?.paperAbstract,
          title: paper.result?.title,
          status: paper.result?.status,
          date: paper.result?.timestamp,
          link: `https://gateway.lighthouse.storage/ipfs/${paper.result?.ipfsHash}`,
          publisher: paper.result?.publisher,
        };
      });

      setMyPapers(temp);

      // Process publications data from papers (papers that the user is submitting)
      const publicationsData: Publication[] = temp
        .filter((paper) => paper.status >= 1) // Status 1+ are in publication process
        .map((paper) => {
          let status = "Submitted";
          let progress = 20;
          let journal = "Unknown Journal";

          // Set status and progress based on paper status
          if (paper.status === 1) {
            // InApplication
            status = "Submitted";
            progress = 20;
          } else if (paper.status === 2) {
            // InReview
            status = "Under Review";
            progress = 60;
          } else if (paper.status === 3) {
            // Published
            status = "Accepted";
            progress = 100;
          }

          // For MVP, we'll just use placeholder journal names based on publisher address
          if (
            paper.publisher &&
            paper.publisher !== "0x0000000000000000000000000000000000000000"
          ) {
            // Format a short version of the publisher address for display
            journal = `Journal (${paper.publisher.slice(
              0,
              6
            )}...${paper.publisher.slice(-4)})`;
          }

          return {
            id: paper.id,
            title: paper.title,
            journal: journal,
            submittedDate: timestampToLocalDateTime(Number(paper.date)),
            status: status,
            progress: progress,
          };
        });

      setPublications(publicationsData);
      setIsLoading(false);
    };

    if (allPapers && allPapers.length) normalizeThePapers();
    else setIsLoading(false);
  }, [allPapers]);

  // Process reviews data when loaded
  useEffect(() => {
    const processReviews = async () => {
      if (!allReviews || !allReviews.length) return;

      const reviewContributions: Contribution[] = [];

      // Now create contribution objects for each review
      allReviews.forEach((review) => {
        const paperId = review.result?.paperId.toString();

        // Determine reward amount (convert from wei to ETH if it exists)
        const rewardAmount = review.result?.bountyAmount
          ? Number(review.result.bountyAmount) / 1e18 // Convert from wei to ETH
          : 0;

        // Determine review type based on status
        let reviewType = "Peer Review";
        if (review.result?.status === 1) {
          reviewType = "Peer Review (Accepted)";
        } else if (review.result?.status === 2) {
          reviewType = "Peer Review (Rejected)";
        }

        reviewContributions.push({
          id: review.result?.reviewId.toString(),
          paperId: paperId,
          type: reviewType,
          date: timestampToLocalDateTime(Number(review.result?.timestamp)),
          reward: rewardAmount,
        });
      });

      setContributions(reviewContributions);
    };

    processReviews();
  }, [allReviews]);

  // Get papers where the user is the publisher (incoming publication requests)
  useEffect(() => {
    const getIncomingPublications = async () => {
      if (!latestPaperId) return;
      // Check each paper to see if the current user is the publisher
      var temp = allOfPapers?.map((paperData) => {
        if (
          paperData &&
          paperData.result &&
          paperData.result.publisher === address
        ) {
          // This paper has been submitted to the current user as publisher
          const paper = paperData.result;

          let status = "Submitted";
          let progress = 20;

          // Set status and progress based on paper status
          if (paper.status === 1) {
            // InApplication
            status = "Submitted";
            progress = 20;
          } else if (paper.status === 2) {
            // InReview
            status = "Under Review";
            progress = 60;
          } else if (paper.status === 3) {
            // Published
            status = "Accepted";
            progress = 100;
          }

          return {
            id: paper._tokenId.toString(),
            title: paper.title,
            journal: "Your Journal", // This would be replaced with actual journal name in a real app
            submittedDate: timestampToLocalDateTime(Number(paper.timestamp)),
            status: status,
            progress: progress,
          };
        }
      });

      temp = temp?.filter((t) => t);

      setIncomingPublications(temp);
    };

    if (allOfPapers && allOfPapers.length) getIncomingPublications();
  }, [allOfPapers]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate the tokens earned from contributions
  const totalTokensEarned = contributions.reduce(
    (acc, curr) => acc + curr.reward,
    0
  );
  const rewardCurrency = totalTokensEarned > 0 ? "ETH" : "TestTokens";

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your research papers, contributions, and publication
            applications.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Papers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myPapers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {myPapers?.filter((p) => p.status === 3).length || 0} published
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contributions.length}</div>
              <p className="text-xs text-muted-foreground">
                {totalTokensEarned.toFixed(4)} {rewardCurrency} earned
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Publication Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publications.length}</div>
              <p className="text-xs text-muted-foreground">
                {publications.filter((p) => p.status === "Accepted").length}{" "}
                accepted
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="papers">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="papers">My Papers</TabsTrigger>
            <TabsTrigger value="contributions">My Contributions</TabsTrigger>
            <TabsTrigger value="publications">My Submissions</TabsTrigger>
            <TabsTrigger value="incoming">Incoming Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Research Papers</h2>
              <Link href="/upload">
                <Button>Upload New Paper</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {myPapers.length > 0 ? (
                myPapers.map((paper) => (
                  <Card key={paper.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {paper.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Uploaded on{" "}
                                {timestampToLocalDateTime(parseInt(paper.date))}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                          <Badge
                            className={getStatusColor(
                              inferStatus(paper.status)
                            )}
                          >
                            {inferStatus(paper.status)}
                          </Badge>
                          <Link href={`/papers/${paper.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No papers uploaded yet.</p>
                  <p className="text-sm">
                    Upload your first research paper to get started.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Contributions</h2>
            </div>

            <div className="space-y-4">
              {contributions.length > 0 ? (
                contributions.map((contribution) => (
                  <Card key={contribution.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {contribution.paperTitle}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{contribution.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {contribution.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {contribution.reward > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              +{contribution.reward} ETH
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                          <Link href={`/papers/${contribution.paperId}`}>
                            <Button variant="outline" size="sm">
                              View Paper
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No contributions yet.</p>
                  <p className="text-sm">
                    Review other researchers' papers to earn rewards.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="publications" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                My Publication Submissions
              </h2>
              <Link href="/publication">
                <Button>New Submission</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {publications.length > 0 ? (
                publications.map((publication) => (
                  <Card key={publication.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {publication.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {publication.journal} • Submitted on{" "}
                            {publication.submittedDate}
                          </p>
                          <Progress
                            value={publication.progress}
                            className="h-2 w-full"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(publication.status)}>
                            {publication.status}
                          </Badge>
                          <Link href={`/papers/${publication.id}`}>
                            <Button variant="outline" size="sm">
                              View Paper
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No publication submissions yet.</p>
                  <p className="text-sm">
                    Submit your papers to journals for publication.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="incoming" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Incoming Publication Requests
              </h2>
            </div>

            <div className="space-y-4">
              {incomingPublications.length > 0 ? (
                incomingPublications.map((publication) => (
                  <Card key={publication.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {publication.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Submitted to: {publication.journal} • Received on{" "}
                            {publication.submittedDate}
                          </p>
                          <Progress
                            value={publication.progress}
                            className="h-2 w-full"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(publication.status)}>
                            {publication.status}
                          </Badge>
                          <Link href={`/papers/${publication.id}`}>
                            <Button variant="outline" size="sm">
                              Review Submission
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No incoming publication requests.</p>
                  <p className="text-sm">
                    Papers submitted to you for review will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
