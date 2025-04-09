# SageNet: A Web3-Powered Research Platform

A safe, decentralized platform for research enthusiasts to publish papers with proof of ownership, apply for journal publications, offer peer review bounties, and contribute to others’ research. Powered by EDU-CHAIN and assisted by Sagey — your AI agent for fast, related research discovery.

---

## 📘 Table of Contents

- [Understanding the Problem](#understanding-the-problem)
  - [Our Narrative](#our-narrative)
  - [Problems Faced by Others](#problems-faced-by-others)
- [🔍 Features](#-features)
- [🧠 Tech Stack](#-tech-stack)
- [🚀 Running Locally](#-running-locally)
- [📄 License](#-license)
- [👥 Authors](#-authors)

---

## Understanding the Problem

### Our Narrative

Parth (@Par-t) completed our mandatory 6-month industry training through research instead of the more conventional internship route — a rare path due to the lack of **research support in India**. This decision came with several challenges during his work on **TOPIC**:

1. Many professors prioritize **quantity of publication** over **quality** and global standards.
2. The journal submission process is **slow** and **opaque**, often requiring repeated follow-ups.
3. Peer reviews are often done by TAs, resulting in **low-quality feedback** due to a lack of incentives.

### Problems Faced by Others

1. **Lack of Proof of Authorship:** Difficulty establishing ownership, leading to plagiarism risks.  
2. **Opaque Submission Process:** Traditional journal pipelines are time-consuming and frustrating.  
3. **Difficulty Finding Related Research:** Researchers struggle to avoid redundancy.  
4. **Predatory Publishing:** Some journals exploit researchers without offering real value.

---

## 🔍 Features

1. **Authorship Tracking with SBTs (ERC721 Tokens)**
   - Receive a Soulbound Token (SBT) on first draft upload.
   - Verifies authorship and combats plagiarism.

2. **Bounty System for Peer Reviews**
   - Offer crypto bounties for quality peer reviews.
   - Smart contracts automate verified review payments.

3. **AI-Powered Research Comparison**
   - Detects plagiarism and finds similar research.
   - Enables better collaboration and prevents duplication.

4. **Decentralized Research Search Engine**
   - Web3-powered, DAO-governed research discovery.
   - Ranks papers fairly — not by SEO or paywalls.

5. **Sagey – Personal AI Research Assistant**
   - Recommends papers and references as you write.
   - Improves literature review and speeds discovery.

---

## 🧠 Tech Stack

### Frontend
- Next.js (TypeScript)
- Wagmi with Reown Wallet

### Agent
- Python with BM25 Algorithm

### Smart Contract
- Foundry
- Solidity
- OpenZeppelin ERC721

---

## 🚀 Running Locally

1. **Clone the repository**
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