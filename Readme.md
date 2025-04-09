# SageNet: A Web3-Powered Research Platform

A safe, decentralized platform for Research enthusiasts to publish their papers with proof of ownership, apply for publication in various Journals, set bounties for peer reviews, and contribute to others' research. Powered by EDU-CHAIN and assisted by Sagey — your AI agent for finding related research fast.

## UNDERSTANDING THE PROBLEM:

### OUR NARRATIVE



## FEATURES( AN OVERVIEW):

1. Authorship Tracking with SBTs(ERC721 tokens)
    * Researchers receive a Soulbound Token (SBT) when they upload their first draft.
    * Ensures proof of authorship and prevents plagiarism.

2. Bounty System for Peer Reviews
    * Researchers can offer crypto bounties to incentivize peer reviews.

    * Smart contracts automate payments when reviews are verified.

3. AI-Powered Research Comparison

    * Uses AI to detect plagiarism and find similar research.

    * Helps in avoiding duplicates and finding collaborations.

4. Decentralized Research Search Engine

    * A Web3-powered search engine for research papers.

    * Uses DAO governance to rank research fairly (not just based on SEO or paywalls).

## TECH STACK

### Frontend

1. Next.js(Typescript)
2. Wagmi with Reown Wallet. 

### Agent

Python with BM25 Algorithm for Similarity search

### Smart Contract

1. Foundry
2. Solidity
3. Open Zeppelin ERC721


## RUNNING LOCALLY

1. Clone the repository:
```bash
git clone https://github.com/prakhar728/SageNet.git && cd SageNet
```

2. Install dependencies:
```bash
cd client
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Add the required variables to `.env`

4. Start the development server:
```bash
pnpm run dev
```
