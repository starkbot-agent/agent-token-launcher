import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import { TokenLaunchConfig, PumpFunResponse, LaunchResult } from '../types';

export class PumpFunClient {
  private static instance: PumpFunClient;
  private readonly baseUrl = 'https://pump.fun/api';
  private readonly rpcUrl = 'https://api.mainnet-beta.solana.com';
  
  static getInstance(): PumpFunClient {
    if (!this.instance) {
      this.instance = new PumpFunClient();
    }
    return this.instance;
  }

  async launchToken(config: TokenLaunchConfig): Promise<LaunchResult> {
    try {
      // Step 1: Upload metadata and image
      const metadataUrl = await this.uploadMetadata(config);
      
      // Step 2: Create token on pump.fun
      const launchResponse = await this.createToken(config, metadataUrl);
      
      if (!launchResponse.success) {
        return {
          success: false,
          error: launchResponse.message || 'Token creation failed'
        };
      }

      return {
        success: true,
        tokenAddress: launchResponse.tokenAddress,
        signature: launchResponse.signature,
        metadataUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async uploadMetadata(config: TokenLaunchConfig): Promise<string> {
    const form = new FormData();
    
    // Add image if provided
    if (config.imagePath && await fs.pathExists(config.imagePath)) {
      const imageBuffer = await fs.readFile(config.imagePath);
      form.append('file', imageBuffer, {
        filename: 'token-image.png',
        contentType: 'image/png'
      });
    }

    // Add metadata
    const metadata = {
      name: config.metadata.name,
      symbol: config.metadata.symbol,
      description: config.metadata.description,
      image: config.metadata.image,
      website: config.metadata.website,
      twitter: config.metadata.twitter,
      telegram: config.metadata.telegram,
      tags: config.metadata.tags || []
    };

    form.append('metadata', JSON.stringify(metadata), {
      contentType: 'application/json'
    });

    try {
      const response = await axios.post(`${this.baseUrl}/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'AgentTokenLauncher/1.0.0'
        },
        timeout: 30000
      });

      if (response.data.success && response.data.metadataUrl) {
        return response.data.metadataUrl;
      }

      throw new Error('Failed to upload metadata');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Metadata upload failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  private async createToken(
    config: TokenLaunchConfig, 
    metadataUrl: string
  ): Promise<PumpFunResponse> {
    const tokenData = {
      name: config.metadata.name,
      symbol: config.metadata.symbol,
      description: config.metadata.description,
      metadata_uri: metadataUrl,
      creator_wallet: config.creatorWallet,
      // Additional pump.fun specific fields
      initial_liquidity: 1, // 1 SOL
      bonding_curve_params: {
        slope: 0.001,
        initial_price: 0.0001
      }
    };

    try {
      const response = await axios.post(`${this.baseUrl}/tokens/create`, tokenData, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgentTokenLauncher/1.0.0'
        },
        timeout: 60000 // Longer timeout for token creation
      });

      return {
        success: response.data.success,
        message: response.data.message,
        tokenAddress: response.data.token_address,
        signature: response.data.signature,
        metadataUrl: response.data.metadata_url
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || error.message
        };
      }
      return {
        success: false,
        message: 'Unknown error during token creation'
      };
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/tokens/${tokenAddress}`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get token info: ${error.message}`);
      }
      throw error;
    }
  }

  async getMarketStatus(tokenAddress: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/tokens/${tokenAddress}/market`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get market status: ${error.message}`);
      }
      throw error;
    }
  }

  // Simulate pump.fun API for development/testing
  async simulateLaunch(config: TokenLaunchConfig): Promise<LaunchResult> {
    console.log('🧪 Simulating pump.fun token launch...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock token address
    const mockTokenAddress = `0x${Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    const mockSignature = `0x${Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    return {
      success: true,
      tokenAddress: mockTokenAddress,
      signature: mockSignature,
      metadataUrl: `https://arweave.net/${Array.from({length: 43}, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.charAt(
          Math.floor(Math.random() * 64)
        )).join('')}`
    };
  }
}