"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Copy, CheckCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function WalletPage() {
  const [walletConnected, setWalletConnected] = useState(true)
  const [walletAddress, setWalletAddress] = useState("0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t")
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Mock token data
  const tokenBalance = 750

  // Mock transaction history
  const transactions = [
    {
      id: 1,
      type: "Earned",
      amount: 50,
      description: "Peer review bounty",
      date: "Nov 15, 2023",
      status: "Completed",
    },
    {
      id: 2,
      type: "Earned",
      amount: 30,
      description: "Technical feedback reward",
      date: "Nov 10, 2023",
      status: "Completed",
    },
    {
      id: 3,
      type: "Spent",
      amount: 100,
      description: "Set bounty for paper review",
      date: "Nov 5, 2023",
      status: "Completed",
    },
    {
      id: 4,
      type: "Earned",
      amount: 200,
      description: "Research publication reward",
      date: "Oct 28, 2023",
      status: "Completed",
    },
    {
      id: 5,
      type: "Spent",
      amount: 50,
      description: "Publication application fee",
      date: "Oct 20, 2023",
      status: "Completed",
    },
  ]

  // Mock bounties
  const activeBounties = [
    {
      id: 1,
      paperTitle: "Decentralized Identity Management in Web3 Applications",
      amount: 150,
      reviewersNeeded: 3,
      reviewersCompleted: 2,
      expiresAt: "Dec 15, 2023",
    },
    {
      id: 2,
      paperTitle: "Privacy-Preserving Data Sharing Using Zero-Knowledge Proofs",
      amount: 100,
      reviewersNeeded: 2,
      reviewersCompleted: 0,
      expiresAt: "Dec 30, 2023",
    },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const connectWallet = () => {
    setWalletConnected(true)
  }

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Wallet & Rewards</h1>
          <p className="text-muted-foreground">Manage your TestTokens, track bounties, and view transaction history.</p>
        </div>

        {walletConnected ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet</CardTitle>
                  <CardDescription>Your Web3 wallet and TestToken balance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Wallet Address</p>
                        <p className="text-xs text-muted-foreground">{truncateAddress(walletAddress)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1">
                      {copiedAddress ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">TestToken Balance</p>
                      <p className="text-3xl font-bold">{tokenBalance}</p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Bounties</CardTitle>
                  <CardDescription>Bounties you've set for paper reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeBounties.length > 0 ? (
                    activeBounties.map((bounty) => (
                      <div key={bounty.id} className="rounded-lg border p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium line-clamp-1">{bounty.paperTitle}</h3>
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {bounty.amount} TestTokens
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {bounty.reviewersCompleted}/{bounty.reviewersNeeded} Reviews
                          </span>
                          <span>Expires: {bounty.expiresAt}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{
                              width: `${(bounty.reviewersCompleted / bounty.reviewersNeeded) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No active bounties</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your TestToken earnings and spending history</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="earned">Earned</TabsTrigger>
                    <TabsTrigger value="spent">Spent</TabsTrigger>
                  </TabsList>
                  <div className="mt-4 space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              transaction.type === "Earned"
                                ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {transaction.type === "Earned" ? (
                              <ArrowDownRight className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              transaction.type === "Earned"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {transaction.type === "Earned" ? "+" : "-"}
                            {transaction.amount} TestTokens
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              transaction.status === "Completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Connect your Web3 wallet to access your TestTokens and rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p>You need to connect your wallet to:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View your TestToken balance</li>
                  <li>• Set bounties for paper reviews</li>
                  <li>• Earn rewards for contributions</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={connectWallet} className="w-full">
                Connect Wallet
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

