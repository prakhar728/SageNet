"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, Check } from "lucide-react";
import { useWriteContract } from "wagmi";
import SageNetCore from "@/contracts/SageNetCore.json";
import ContractAddresses from "@/contracts/DeploymentInfo.json";
import { BountyInfo, PaperFormState } from "@/utils/PaperFormTypes";
import { uploadFile } from "@/utils/ipfs";
import { ResearchAgent } from "@/components/research-agent";


export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, settitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [enableBounty, setEnableBounty] = useState(false);
  const [fileIpfsHash, setfileIpfsHash] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [formState, setFormState] = useState<PaperFormState>({
    // Paper details
    title: "Predictors of Psychological Distress Following Serious Injury",
    abstract: "https://chatgpt.com/c/67f22b3e-e68c-8006-8d8b-6f26e797ec06",
    category: "privacy",
    tags: ["psychology"],
    tagInput: "",

    // File upload
    selectedFile: null,
    fileIpfsHash: "",

    // Bounty settings
    bountyInfo: {
      enabled: false,
      amount: "50",
      reviewers: "3",
    },

    // Form status
    uploadStatus: "idle",
  });

  const updateFormState = (fieldName: keyof PaperFormState, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const updateBountyInfo = (fieldName: keyof BountyInfo, value: any) => {
    setFormState((prev) => ({
      ...prev,
      bountyInfo: {
        ...prev.bountyInfo,
        [fieldName]: value,
      },
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileCid = await uploadFile(e.target.files);
      updateFormState("selectedFile", fileCid);
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && formState.tagInput.trim() !== "") {
      e.preventDefault();
      if (!formState.tags.includes(formState.tagInput.trim())) {
        updateFormState("tags", [...formState.tags, formState.tagInput.trim()]);
      }
      updateFormState("tagInput", "");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateFormState(
      "tags",
      formState.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus("uploading");

    await writeContractAsync({
      abi: SageNetCore.abi,
      address: ContractAddresses.sageNetCore as `0x${string}`,
      functionName: "submitPaper",
      args: [formState.selectedFile, formState.title, formState.abstract],
    });

    setUploadStatus("success");
  };

  // contract interactions
  const { writeContractAsync, isError } = useWriteContract();

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Upload Research Paper</h1>
        <p className="text-muted-foreground">
          Share your research with the community and earn rewards through peer
          reviews.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paper Details</CardTitle>
              <CardDescription>
                Provide information about your research paper.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Paper Title</Label>
                <Input
                  id="title"
                  placeholder="Enter the title of your paper"
                  value={formState.title}
                  onChange={(e) => updateFormState("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 relative"> {/* Added relative positioning */}
                <Label htmlFor="abstract">Abstract</Label>
                <Textarea
                  id="abstract"
                  placeholder="Provide a brief summary of your research"
                  className="min-h-[100px]"
                  value={formState.abstract}
                  onChange={(e) => updateFormState("abstract", e.target.value)}
                  required
                />
                {/* Add the Research Agent component */}
                <ResearchAgent abstractText={formState.abstract} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) => updateFormState("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blockchain">
                      Blockchain Technology
                    </SelectItem>
                    <SelectItem value="cryptography">Cryptography</SelectItem>
                    <SelectItem value="defi">Decentralized Finance</SelectItem>
                    <SelectItem value="nft">NFTs & Digital Assets</SelectItem>
                    <SelectItem value="dao">DAOs & Governance</SelectItem>
                    <SelectItem value="privacy">Privacy & Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formState.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <Input
                  id="tags"
                  placeholder="Add tags (press Enter to add)"
                  value={formState.tagInput}
                  onChange={(e) => updateFormState("tagInput", e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Upload your research paper in PDF format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 ${
                    selectedFile ? "border-primary" : "border-border"
                  }`}
                >
                  {!selectedFile ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF (MAX. 20MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-10 h-10 mb-3 text-primary" />
                      <p className="mb-2 text-sm font-medium">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={
                uploadStatus === "uploading" || uploadStatus === "success"
              }
              className="min-w-[120px]"
            >
              {uploadStatus === "uploading" ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </span>
              ) : uploadStatus === "success" ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Uploaded
                </span>
              ) : (
                "Upload Paper"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}