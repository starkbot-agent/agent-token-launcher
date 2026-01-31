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
  imagePath?: string;
  generateImage?: boolean;
  imagePrompt?: string;
  simulate?: boolean;
}

export interface LaunchResult {
  success: boolean;
  tokenAddress?: string;
  signature?: string;
  metadataUrl?: string;
  error?: string;
  timestamp?: number;
}

export interface DeploymentTracker {
  tokenAddress: string;
  creator: string;
  timestamp: number;
  symbol: string;
  name: string;
  metadataUrl: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  errorMessage?: string;
}

export interface AgentStats {
  totalLaunches: number;
  successfulLaunches: number;
  failedLaunches: number;
  pendingLaunches: number;
  totalGasUsed?: string;
  averageGasUsed?: string;
  firstLaunch?: Date;
  lastLaunch?: Date;
}

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'cartoon' | 'realistic' | 'minimalist' | 'pixel';
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  outputPath?: string;
}

export interface PumpFunTokenInfo {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  marketCap?: number;
  price?: number;
  volume?: number;
  holders?: number;
  bondingCurveProgress?: number;
}

export interface MarketStatus {
  tokenAddress: string;
  isLive: boolean;
  marketCap: number;
  price: number;
  volume: number;
  priceChange24h: number;
  bondingCurveProgress: number;
  isComplete: boolean;
  isGraduated: boolean;
}

export interface ImageUploadResult {
  url: string;
  ipfsHash: string;
  size: number;
  contentType: string;
}

export interface MetadataUploadResult {
  url: string;
  ipfsHash: string;
  metadata: TokenMetadata;
}

export interface ErrorResult {
  success: false;
  error: string;
  details?: any;
}

export interface SuccessResult<T> {
  success: true;
  data: T;
}

export type Result<T> = SuccessResult<T> | ErrorResult;