import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { TokenLaunchConfig, LaunchResult, DeploymentTracker, AgentStats, TokenMetadata, ImageGenerationOptions } from '../types';
import { ImageGenerator } from './image-generator';
import { PumpFunClient } from './pump-fun-client';
import { DeploymentTrackerService } from './deployment-tracker';

export class LaunchManager {
  private static instance: LaunchManager;
  private imageGenerator: ImageGenerator;
  private pumpFunClient: PumpFunClient;
  private deploymentTracker: DeploymentTrackerService;

  private constructor() {
    this.imageGenerator = ImageGenerator.getInstance();
    this.pumpFunClient = PumpFunClient.getInstance();
    this.deploymentTracker = DeploymentTrackerService.getInstance();
  }

  public static getInstance(): LaunchManager {
    if (!LaunchManager.instance) {
      LaunchManager.instance = new LaunchManager();
    }
    return LaunchManager.instance;
  }

  public async launchToken(config: TokenLaunchConfig): Promise<LaunchResult> {
    try {
      // Generate image if requested
      let imageUrl: string;
      if (config.generateImage) {
        const imageOptions: ImageGenerationOptions = {
          prompt: config.imagePrompt || `${config.metadata.name} cryptocurrency token logo`,
          style: 'cartoon',
          width: 512,
          height: 512
        };
        
        const imagePath = await this.imageGenerator.generateTokenImage(imageOptions);
        imageUrl = await this.pumpFunClient.uploadImage(imagePath);
        
        // Clean up temporary image file
        await fs.unlink(imagePath).catch(() => {});
      } else if (config.imagePath) {
        imageUrl = await this.pumpFunClient.uploadImage(config.imagePath);
      } else {
        throw new Error('Either imagePath or generateImage must be provided');
      }

      // Update metadata with image URL
      const metadata: TokenMetadata = {
        ...config.metadata,
        image: imageUrl
      };

      // Upload metadata to IPFS
      const metadataUrl = await this.pumpFunClient.uploadMetadata(metadata);

      // Create token on pump.fun
      const launchResult = await this.pumpFunClient.createToken({
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: imageUrl,
        metadata: metadataUrl,
        creator: config.creatorWallet
      });

      if (launchResult.success && launchResult.tokenAddress) {
        // Track deployment
        const deployment: DeploymentTracker = {
          tokenAddress: launchResult.tokenAddress,
          creator: config.creatorWallet,
          timestamp: Date.now(),
          symbol: metadata.symbol,
          name: metadata.name,
          metadataUrl,
          status: 'pending',
          transactionHash: launchResult.signature
        };

        await this.deploymentTracker.trackDeployment(deployment);

        return {
          success: true,
          tokenAddress: launchResult.tokenAddress,
          signature: launchResult.signature,
          metadataUrl,
          timestamp: Date.now()
        };
      } else {
        return {
          success: false,
          error: launchResult.error || 'Unknown launch error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async simulateLaunch(config: TokenLaunchConfig): Promise<LaunchResult> {
    try {
      // Validate configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Simulate image generation
      let imageUrl = 'https://example.com/simulated-image.png';
      if (config.generateImage) {
        imageUrl = `https://example.com/simulated-${Date.now()}.png`;
      }

      // Simulate metadata upload
      const metadataUrl = `https://ipfs.io/ipfs/simulated-${createHash('sha256').update(JSON.stringify(config.metadata)).digest('hex').slice(0, 16)}`;

      // Simulate token creation
      const simulatedAddress = `0x${createHash('sha256').update(`${config.creatorWallet}:${config.metadata.symbol}:${Date.now()}`).digest('hex').slice(0, 40)}`;
      const simulatedSignature = `0x${createHash('sha256').update(`${simulatedAddress}:${Date.now()}`).digest('hex')}`;

      console.log('🧪 Simulation mode - no real token created');
      console.log(`   Token: ${config.metadata.name} (${config.metadata.symbol})`);
      console.log(`   Creator: ${config.creatorWallet}`);
      console.log(`   Image: ${imageUrl}`);
      console.log(`   Metadata: ${metadataUrl}`);

      return {
        success: true,
        tokenAddress: simulatedAddress,
        signature: simulatedSignature,
        metadataUrl,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation error'
      };
    }
  }

  public validateConfig(config: TokenLaunchConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate metadata
    if (!config.metadata.name || config.metadata.name.trim().length === 0) {
      errors.push('Token name is required');
    }

    if (!config.metadata.symbol || config.metadata.symbol.trim().length === 0) {
      errors.push('Token symbol is required');
    } else if (config.metadata.symbol.length > 10) {
      errors.push('Token symbol must be 10 characters or less');
    }

    if (!config.metadata.description || config.metadata.description.trim().length === 0) {
      errors.push('Token description is required');
    }

    // Validate wallet address
    if (!config.creatorWallet || !this.isValidEthereumAddress(config.creatorWallet)) {
      errors.push('Valid creator wallet address is required');
    }

    // Validate image options
    if (!config.imagePath && !config.generateImage) {
      errors.push('Either imagePath or generateImage must be provided');
    }

    if (config.imagePath && config.generateImage) {
      errors.push('Cannot specify both imagePath and generateImage');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  public async getLaunchStatus(tokenAddress: string) {
    try {
      const tokenInfo = await this.pumpFunClient.getTokenInfo(tokenAddress);
      const marketStatus = await this.pumpFunClient.getMarketStatus(tokenAddress);
      const tracked = await this.deploymentTracker.isTracked(tokenAddress);

      return {
        tokenAddress,
        tokenInfo,
        marketStatus,
        tracked
      };
    } catch (error) {
      return {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Failed to get token status'
      };
    }
  }

  public async getAgentStats(creatorAddress?: string): Promise<AgentStats> {
    return await this.deploymentTracker.getStats(creatorAddress);
  }

  public async getRecentLaunches(limit: number = 10): Promise<DeploymentTracker[]> {
    return await this.deploymentTracker.getRecentLaunches(limit);
  }

  public async generateReport(creatorAddress?: string): Promise<string> {
    const stats = await this.getAgentStats(creatorAddress);
    const recentLaunches = await this.getRecentLaunches(10);
    
    const report = [
      '# Agent Token Launcher Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Statistics',
      `- Total Launches: ${stats.totalLaunches}`,
      `- Successful: ${stats.successfulLaunches}`,
      `- Failed: ${stats.failedLaunches}`,
      `- Pending: ${stats.pendingLaunches}`,
      '',
      '## Recent Launches',
      ...recentLaunches.map((launch, index) => 
        `${index + 1}. ${launch.name} (${launch.symbol}) - ${launch.status} - ${new Date(launch.timestamp).toLocaleDateString()}`
      ),
      '',
      creatorAddress ? `Creator: ${creatorAddress}` : 'All creators'
    ].join('\n');

    return report;
  }

  public async exportLaunches(format: 'json' | 'csv' = 'json'): Promise<string> {
    const launches = await this.deploymentTracker.getAllLaunches();
    
    if (format === 'json') {
      return JSON.stringify(launches, null, 2);
    } else if (format === 'csv') {
      const headers = ['Token Address', 'Name', 'Symbol', 'Creator', 'Status', 'Timestamp', 'Metadata URL'];
      const rows = launches.map(launch => [
        launch.tokenAddress,
        launch.name,
        launch.symbol,
        launch.creator,
        launch.status,
        new Date(launch.timestamp).toISOString(),
        launch.metadataUrl
      ].map(field => `"${field}"`).join(','));
      
      return [headers.join(','), ...rows].join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  public async cleanupOldLaunches(days: number = 30): Promise<number> {
    return await this.deploymentTracker.cleanupOldLaunches(days);
  }
}