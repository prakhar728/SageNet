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
import ContractAddresses from "@/contracts/DeploymentInfo.json";
import { useEffect, useState } from "react";
import { myPaper } from "@/utils/PaperFormTypes";

export default function DashboardPage() {
  const [myPapers, setMyPapers] = useState<myPaper[]>([]);

  const contributions = [
    {
      id: 1,
      paperTitle: "Smart Contract Vulnerabilities: Detection and Prevention",
      type: "Peer Review",
      date: "2023-11-10",
      reward: 25,
    },
    {
      id: 2,
      paperTitle: "Blockchain-Based Supply Chain Management Systems",
      type: "Peer Review",
      date: "2023-10-28",
      reward: 30,
    },
    {
      id: 3,
      paperTitle: "Decentralized Finance: Opportunities and Challenges",
      type: "Technical Feedback",
      date: "2023-11-15",
      reward: 15,
    },
  ];

  const publications = [
    {
      id: 1,
      title: "Decentralized Identity Management in Web3 Applications",
      journal: "Journal of Blockchain Research",
      submittedDate: "2023-09-20",
      status: "Accepted",
      progress: 100,
    },
    {
      id: 2,
      title:
        "Comparative Analysis of Consensus Algorithms in Blockchain Networks",
      journal: "Distributed Ledger Technology Review",
      submittedDate: "2023-10-25",
      status: "Under Review",
      progress: 60,
    },
    {
      id: 3,
      title: "Privacy-Preserving Data Sharing Using Zero-Knowledge Proofs",
      journal: "Cryptography and Network Security Journal",
      submittedDate: "2023-11-10",
      status: "Submitted",
      progress: 20,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
      case "Accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "In Review":
      case "Under Review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Draft":
      case "Submitted":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "";
    }
  };

  const inferStatus = (status: number) => {
    switch (status) {
      case 0:
        return "Draft";
      case 1:
        return "Submitted";
      case 2:
        return "In Review";
      case 3:
        return "Accepted";
      default:
        return "";
    }
  };

  function timestampToLocalDateTime(timestamp: number): string {
    // If the timestamp is in seconds, convert to milliseconds
    if (timestamp.toString().length === 10) {
      timestamp *= 1000;
    }
  
    const date = new Date(timestamp);
    return date.toLocaleString(); // Converts to local date and time
  }  

  // contract interactions

  const { address } = useAccount();

  console.log(address);

  const { data: paperIds, error } = useReadContract({
    abi: SageNetCore.abi,
    address: ContractAddresses.sageNetCore as `0x${string}`,
    functionName: "getPapersByAuthor",
    args: [address],
  });

  const {
    data: allPapers,
    isLoading,
    error: multipleReadError,
  } = useReadContracts({
    contracts: (paperIds ? (paperIds as BigInt[]) : []).map((id) => ({
      address: ContractAddresses.sageNetCore as `0x${string}`,
      abi: SageNetCore.abi,
      functionName: "getPaper",
      args: [id],
    })),
  });

  // useEffects to populate data

  useEffect(() => {
    const normalizeThePapers = async () => {
      const temp = allPapers?.map((paper) => {
        return {
          id: paper.result?._tokenId,
          abstract: paper.result.paperAbstract,
          title: paper.result.title,
          status: paper.result.status,
          date: paper.result.timestamp,
          link: `https://gateway.lighthouse.storage/ipfs/${paper.result.ipfsHash}`,
        };
      });

      setMyPapers(temp);
    };
    console.log(allPapers);

    if (allPapers && allPapers.length) normalizeThePapers();
  }, [allPapers]);

  const populateDashboardData = async () => {};

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
              <div className="text-2xl font-bold">{myPapers.length}</div>
              <p className="text-xs text-muted-foreground">
                {myPapers.filter((p) => p.status === 3).length}{" "}
                published
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
                {contributions.reduce((acc, curr) => acc + curr.reward, 0)}{" "}
                TestTokens earned
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="papers">My Papers</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Research Papers</h2>
              <Link href="/upload">
                <Button>Upload New Paper</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {myPapers.map((paper) => (
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
                              Uploaded on {timestampToLocalDateTime(parseInt(paper.date))}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                        <Badge className={getStatusColor(inferStatus(paper.status))}>
                          {inferStatus(paper.status)}
                        </Badge>
                        <Link href={paper.link}>
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
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold">My Contributions</h2>

            <div className="space-y-4">
              {contributions.map((contribution) => (
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
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          +{contribution.reward} TestTokens
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="publications" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Publication Applications
              </h2>
              <Link href="/publication">
                <Button>New Application</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {publications.map((publication) => (
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
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(publication.status)}>
                          {publication.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
