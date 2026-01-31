export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  tags?: string[];
}

export interface TokenLaunchConfig {
  metadata: TokenMetadata;
  creatorWallet: string;
  privateKey?: string;
  imagePath?: string;
  generateImage?: boolean;
  imagePrompt?: string;
}

export interface LaunchResult {
  success: boolean;
  tokenAddress?: string;
  signature?: string;
  error?: string;
  metadataUrl?: string;
}

export interface DeploymentTracker {
  tokenAddress: string;
  creator: string;
  timestamp: number;
  symbol: string;
  name: string;
  metadataUrl: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface PumpFunResponse {
  success: boolean;
  message?: string;
  tokenAddress?: string;
  signature?: string;
  metadataUrl?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  style?: 'cartoon' | 'realistic' | 'minimalist' | 'pixel';
  colors?: string[];
}

export interface AgentProfile {
  name: string;
  description: string;
  walletAddress: string;
  reputation: number;
  tokensLaunched: number;
  successfulLaunches: number;
}