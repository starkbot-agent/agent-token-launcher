import fs from 'fs-extra';
import path from 'path';
import { DeploymentTracker } from '../types';

export class DeploymentTrackerService {
  private static instance: DeploymentTrackerService;
  private readonly dataDir = 'data';
  private readonly deploymentsFile = path.join(this.dataDir, 'deployments.json');
  
  static getInstance(): DeploymentTrackerService {
    if (!this.instance) {
      this.instance = new DeploymentTrackerService();
    }
    return this.instance;
  }

  private constructor() {
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory(): Promise<void> {
    await fs.ensureDir(this.dataDir);
  }

  async addDeployment(deployment: DeploymentTracker): Promise<void> {
    const deployments = await this.getAllDeployments();
    deployments.push(deployment);
    
    await fs.writeJSON(this.deploymentsFile, deployments, { spaces: 2 });
  }

  async getAllDeployments(): Promise<DeploymentTracker[]> {
    try {
      if (await fs.pathExists(this.deploymentsFile)) {
        return await fs.readJSON(this.deploymentsFile);
      }
    } catch (error) {
      console.warn('Failed to read deployments file:', error);
    }
    
    return [];
  }

  async getDeploymentByTokenAddress(tokenAddress: string): Promise<DeploymentTracker | null> {
    const deployments = await this.getAllDeployments();
    return deployments.find(d => d.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) || null;
  }

  async getDeploymentsByCreator(creatorAddress: string): Promise<DeploymentTracker[]> {
    const deployments = await this.getAllDeployments();
    return deployments.filter(d => 
      d.creator.toLowerCase() === creatorAddress.toLowerCase()
    );
  }

  async updateDeploymentStatus(
    tokenAddress: string, 
    status: 'pending' | 'confirmed' | 'failed'
  ): Promise<void> {
    const deployments = await this.getAllDeployments();
    const index = deployments.findIndex(d => 
      d.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    if (index !== -1) {
      deployments[index].status = status;
      await fs.writeJSON(this.deploymentsFile, deployments, { spaces: 2 });
    }
  }

  async getAgentStats(creatorAddress: string): Promise<{
    totalLaunches: number;
    successfulLaunches: number;
    failedLaunches: number;
    pendingLaunches: number;
    totalTokens: number;
  }> {
    const deployments = await this.getDeploymentsByCreator(creatorAddress);
    
    return {
      totalLaunches: deployments.length,
      successfulLaunches: deployments.filter(d => d.status === 'confirmed').length,
      failedLaunches: deployments.filter(d => d.status === 'failed').length,
      pendingLaunches: deployments.filter(d => d.status === 'pending').length,
      totalTokens: deployments.length
    };
  }

  async getRecentDeployments(limit: number = 10): Promise<DeploymentTracker[]> {
    const deployments = await this.getAllDeployments();
    return deployments
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async exportDeployments(format: 'json' | 'csv' = 'json'): Promise<string> {
    const deployments = await this.getAllDeployments();
    
    if (format === 'csv') {
      return this.convertToCSV(deployments);
    }
    
    return JSON.stringify(deployments, null, 2);
  }

  private convertToCSV(deployments: DeploymentTracker[]): string {
    const headers = [
      'Token Address',
      'Creator',
      'Timestamp',
      'Symbol',
      'Name',
      'Metadata URL',
      'Status'
    ];
    
    const rows = deployments.map(d => [
      d.tokenAddress,
      d.creator,
      new Date(d.timestamp).toISOString(),
      d.symbol,
      d.name,
      d.metadataUrl,
      d.status
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  async cleanupOldDeployments(olderThanDays: number = 30): Promise<number> {
    const deployments = await this.getAllDeployments();
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    const filteredDeployments = deployments.filter(d => d.timestamp > cutoffTime);
    const removedCount = deployments.length - filteredDeployments.length;
    
    if (removedCount > 0) {
      await fs.writeJSON(this.deploymentsFile, filteredDeployments, { spaces: 2 });
    }
    
    return removedCount;
  }

  async generateReport(creatorAddress?: string): Promise<string> {
    const deployments = creatorAddress 
      ? await this.getDeploymentsByCreator(creatorAddress)
      : await this.getAllDeployments();
    
    const stats = {
      total: deployments.length,
      byStatus: {
        pending: deployments.filter(d => d.status === 'pending').length,
        confirmed: deployments.filter(d => d.status === 'confirmed').length,
        failed: deployments.filter(d => d.status === 'failed').length
      },
      byTimeframe: {
        last24h: deployments.filter(d => Date.now() - d.timestamp < 24 * 60 * 60 * 1000).length,
        last7d: deployments.filter(d => Date.now() - d.timestamp < 7 * 24 * 60 * 60 * 1000).length,
        last30d: deployments.filter(d => Date.now() - d.timestamp < 30 * 24 * 60 * 60 * 1000).length
      },
      topCreators: this.getTopCreators(deployments)
    };
    
    return this.formatReport(stats, creatorAddress);
  }

  private getTopCreators(deployments: DeploymentTracker[]): Array<{address: string, count: number}> {
    const creatorCounts = new Map<string, number>();
    
    deployments.forEach(d => {
      const count = creatorCounts.get(d.creator) || 0;
      creatorCounts.set(d.creator, count + 1);
    });
    
    return Array.from(creatorCounts.entries())
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private formatReport(stats: any, creatorAddress?: string): string {
    const lines = [
      '📊 Token Launch Deployment Report',
      '==================================',
      '',
      `Total Deployments: ${stats.total}`,
      `Creator Filter: ${creatorAddress || 'All Creators'}`,
      '',
      'Status Distribution:',
      `  ✅ Confirmed: ${stats.byStatus.confirmed}`,
      `  ⏳ Pending: ${stats.byStatus.pending}`,
      `  ❌ Failed: ${stats.byStatus.failed}`,
      '',
      'Recent Activity:',
      `  Last 24h: ${stats.byTimeframe.last24h}`,
      `  Last 7d: ${stats.byTimeframe.last7d}`,
      `  Last 30d: ${stats.byTimeframe.last30d}`,
      ''
    ];
    
    if (stats.topCreators.length > 0) {
      lines.push('Top Creators:');
      stats.topCreators.forEach((creator: any, index: number) => {
        lines.push(`  ${index + 1}. ${creator.address}: ${creator.count} launches`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }
}