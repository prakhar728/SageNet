import lighthouse from "@lighthouse-web3/sdk";

const LIGHTHOUSE_KEY = process.env.NEXT_PUBLIC_IPFS_KEY  || "";

export const uploadFile = async (file: any) => {
  console.log(file);
  
  const output = await lighthouse.upload(file, LIGHTHOUSE_KEY);
  console.log("File Status:", output);

  console.log(
    "Visit at https://gateway.lighthouse.storage/ipfs/" + output.data.Hash
  );

  return output.data.Hash;
};


export const uploadText = async (text: string) => {
    const response = await lighthouse.uploadText(text, LIGHTHOUSE_KEY);

    return response.data.Hash;
}