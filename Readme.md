# SageNet: A Web3-Powered Research Platform

A safe, decentralized platform for Research enthusiasts to publish their papers with proof of ownership, apply for publication in various Journals, set bounties for peer reviews, and contribute to others' research. Powered by EDU-CHAIN and assisted by Sagey — your AI agent for finding related research fast.

## UNDERSTANDING THE PROBLEM:

### OUR NARRATIVE

 Parth(@Par-t) completed our mandatory 6 month industry training by opting for a **research** for our 6 months instead of of the more conventional internship route, a choice that not many take due to the lack of **Research Support in India**. That decision marked the beginning of a series of challenges.

During his time in the 6 months while working on **TOPIC** we faced several challenges.

1. Many professors in India prioritize **publication quantity** over **research quality** and adherence to global standards.
2. The journal submission process is painfully **slow** and **opaque** — often requiring repeated follow-ups just to get basic updates.
3. Peer reviews are frequently delegated to TAs or assistants, resulting in **low-quality feedback**, as there's no direct incentive for reviewers to invest time or effort.

### PROBLEMS FACED BY OTHERS

1. Lack of Proof of Authorship: 
Researchers often struggle to establish clear ownership of their work, leading to potential disputes and plagiarism. 
2. Lengthy and Opaque Journal Submission Processes: Traditional journal submissions can be time-consuming and lack transparency, causing frustration among researchers. 
3. Difficulty in Identifying Related Research: Researchers may find it challenging to locate existing studies related to their work, leading to redundant efforts.
4. Predatory Publishing Practices: The rise of predatory journals exploits researchers by charging fees without providing proper peer review or editorial services, leading to the dissemination of unvetted and potentially flawed studies


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
5. Sagey – Your Personal AI Research Assistant
    * Suggests related papers and references while you write the abstract.
    * Enhances discovery, speeds up literature review, and reduces redundant work.

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


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 👥 Authors

- [@prakhar728](https://github.com/prakhar728) - UG at IIIT Surat(2024 pass out)
- [@Par-t](https://github.com/Par-t) - UG at IIIT Surat(2024 pass out), Master at SBU(AI)