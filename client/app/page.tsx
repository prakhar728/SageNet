import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Award, Users, Calendar, TrendingUp, AlertCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Decentralizing Research with Web3
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Publish your research, earn peer reviews, and receive rewards through blockchain technology.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/explore">
                <Button size="lg" className="gap-1">
                  Explore Research
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/upload">
                <Button size="lg" variant="outline">
                  Start Research
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A decentralized platform for academic research powered by blockchain technology.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Publish Research</h3>
                <p className="text-muted-foreground">
                  Upload your papers to IPFS and mint an SBT as proof of authorship.
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Peer Review</h3>
                <p className="text-muted-foreground">
                  Contribute to the community by reviewing papers and earning tokens.
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Earn Rewards</h3>
                <p className="text-muted-foreground">
                  Get rewarded with TestTokens for your contributions to the research community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Section 1: Project Roadmap */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Project Roadmap</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our journey to revolutionize academic research and publishing
              </p>
            </div>
          </div>
          
          <div className="relative mx-auto max-w-5xl">
            {/* Timeline Line */}
            <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 bg-muted md:block hidden"></div>
            
            {/* Phase 1 */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex md:justify-end md:items-center">
                <div className="w-full md:max-w-md space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">Phase 1: Foundation</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Next 2 Months</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-left">
                      <li>Launch testnet with security-audited smart contracts</li>
                      <li>Implement core features: paper publishing, bounties, peer reviews</li>
                      <li>Upgrade Sagey AI for better similarity detection</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="md:pt-16"></div>
            </div>
            
            {/* Phase 2 */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mt-8">
              <div className="md:pt-16"></div>
              <div className="flex md:items-center">
                <div className="w-full md:max-w-md space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">Phase 2: Community</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Following 1 Month</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-left">
                      <li>Gather feedback from early testnet users</li>
                      <li>Iterate quickly to improve platform usability</li>
                      <li>Conduct outreach to IITs and research clubs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phase 3 */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mt-8">
              <div className="flex md:justify-end md:items-center">
                <div className="w-full md:max-w-md space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">Phase 3: Expansion</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Next 3 Months</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-left">
                      <li>Build integrated research paper writing interface</li>
                      <li>Launch premium AI-assisted writing tools</li>
                      <li>Partner with academic journals for direct submissions</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="md:pt-16"></div>
            </div>
          </div>
        </div>
      </section>

      {/* New Section 2: Current Challenges in Research */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Addressing Key Challenges</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Real problems faced by the research community that SageNet aims to solve
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Challenge 1 */}
            <div className="flex flex-col space-y-4 rounded-lg border overflow-hidden bg-card shadow-sm">
              <div className="aspect-video bg-muted relative">
                <img 
                  src="article-1.png" 
                  alt="Peer Review Challenges" 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-4 left-4 bg-background/80 rounded-full px-3 py-1 text-xs font-medium">
                  From Nature Journal
                </div>
              </div>
              <div className="flex flex-col space-y-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Uncompensated Peer Review</h3>
                </div>
                <p className="text-muted-foreground">
                  "Who Pays the Price for Peer Review?" highlights how reviewers rarely receive compensation or 
                  recognition, leading to lower quality feedback and significant publication delays.
                </p>
                <div className="flex items-center pt-4">
                  <div className="flex-1 border-t"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-md mb-2">Our Solution:</h4>
                  <p className="text-sm text-muted-foreground">
                    SageNet's bounty system enables researchers to offer crypto incentives for quality peer reviews, 
                    with smart contracts automating verified payments to reviewers.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Challenge 2 */}
            <div className="flex flex-col space-y-4 rounded-lg border overflow-hidden bg-card shadow-sm">
              <div className="aspect-video bg-muted relative">
                <img 
                  src="article-2.webp" 
                  alt="Plagiarism and Authorship Issues" 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-4 left-4 bg-background/80 rounded-full px-3 py-1 text-xs font-medium">
                  From Better Science
                </div>
              </div>
              <div className="flex flex-col space-y-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Ethical Review Concerns</h3>
                </div>
                <p className="text-muted-foreground">
                  "Peer Review Ghost-Writing" reveals how senior academics often delegate reviews to junior staff without 
                  acknowledgment, creating ethical issues and undermining the integrity of academic publishing.
                </p>
                <div className="flex items-center pt-4">
                  <div className="flex-1 border-t"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-md mb-2">Our Solution:</h4>
                  <p className="text-sm text-muted-foreground">
                    SageNet's blockchain-based system ensures transparency in reviewer identity and contribution, 
                    with Soulbound Tokens (SBTs) establishing verifiable proof of authorship and review work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Join the Research Revolution
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Be part of the future of academic publishing and research.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}