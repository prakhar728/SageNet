export interface BountyInfo {
    enabled: boolean;
    amount: string; // "25", "50", "100", "200"
    reviewers: string; // "1", "3", "5"
  }
  
 export interface PaperFormState {
    // Paper details
    title: string;
    abstract: string;
    category: string;
    tags: string[];
    tagInput: string;
    
    // File upload
    selectedFile: File | null;
    fileIpfsHash: string;
    
    // Bounty settings
    bountyInfo: BountyInfo;
    
    // Form status
    uploadStatus: "idle" | "uploading" | "success" | "error";
  }


  export type myPaper = {
    id: any;
    abstract: any;
    title: any;
    status: any;
    date: any;
    link: string;
}