#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { LaunchManager } from './services/launch-manager';
import { TokenLaunchConfig, TokenMetadata } from './types';

const program = new Command();
const launchManager = LaunchManager.getInstance();

program
  .name('agent-launch')
  .description('AI Agent Token Launcher for pump.fun')
  .version('1.0.0');

program
  .command('launch')
  .description('Launch a new token on pump.fun')
  .option('-n, --name <name>', 'Token name')
  .option('-s, --symbol <symbol>', 'Token symbol')
  .option('-d, --description <description>', 'Token description')
  .option('-w, --wallet <wallet>', 'Creator wallet address')
  .option('-i, --image <path>', 'Path to token image')
  .option('-g, --generate-image', 'Generate token image automatically')
  .option('--prompt <prompt>', 'Image generation prompt')
  .option('--website <url>', 'Token website')
  .option('--twitter <handle>', 'Twitter handle')
  .option('--telegram <channel>', 'Telegram channel')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--simulate', 'Simulate launch without actually creating token')
  .action(async (options) => {
    try {
      let config: TokenLaunchConfig;

      if (Object.keys(options).length === 0) {
        // Interactive mode
        config = await interactiveLaunch();
      } else {
        // CLI mode
        config = await parseCLIOptions(options);
      }

      // Validate configuration
      const validation = launchManager.validateConfig(config);
      if (!validation.valid) {
        console.error(chalk.red('Configuration validation failed:'));
        validation.errors.forEach(error => console.error(chalk.red(`  • ${error}`)));
        process.exit(1);
      }

      // Launch token
      const result = options.simulate 
        ? await launchManager.simulateLaunch(config)
        : await launchManager.launchToken(config);

      if (result.success) {
        console.log(chalk.green('\n🎉 Token launch completed successfully!'));
        console.log(chalk.blue(`Token Address: ${result.tokenAddress}`));
        console.log(chalk.blue(`Signature: ${result.signature}`));
        console.log(chalk.blue(`Metadata URL: ${result.metadataUrl}`));
      } else {
        console.error(chalk.red(`\n❌ Token launch failed: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n💥 Unexpected error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Get status of a token launch')
  .argument('<token-address>', 'Token contract address')
  .action(async (tokenAddress) => {
    try {
      const status = await launchManager.getLaunchStatus(tokenAddress);
      
      if (status.error) {
        console.error(chalk.red(`Error: ${status.error}`));
        process.exit(1);
      }

      console.log(chalk.blue('Token Status:'));
      console.log(`Address: ${status.tokenAddress}`);
      console.log(`Info: ${JSON.stringify(status.tokenInfo, null, 2)}`);
      console.log(`Market: ${JSON.stringify(status.marketStatus, null, 2)}`);
      
      if (status.tracked) {
        console.log(chalk.green('\nTracked in deployment history'));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Get agent launch statistics')
  .argument('[creator-address]', 'Creator wallet address (optional)')
  .action(async (creatorAddress) => {
    try {
      const stats = await launchManager.getAgentStats(creatorAddress);
      
      console.log(chalk.blue('Agent Launch Statistics:'));
      console.log(`Total Launches: ${stats.totalLaunches}`);
      console.log(`Successful: ${stats.successfulLaunches}`);
      console.log(`Failed: ${stats.failedLaunches}`);
      console.log(`Pending: ${stats.pendingLaunches}`);
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('history')
  .description('View launch history')
  .option('-l, --limit <number>', 'Number of recent launches to show', '10')
  .option('-c, --creator <address>', 'Filter by creator address')
  .action(async (options) => {
    try {
      const limit = parseInt(options.limit);
      const launches = await launchManager.getRecentLaunches(limit);
      
      if (launches.length === 0) {
        console.log(chalk.yellow('No launches found'));
        return;
      }

      console.log(chalk.blue(`Recent Launches (${launches.length}):`));
      launches.forEach((launch, index) => {
        const date = new Date(launch.timestamp).toLocaleString();
        const status = launch.status === 'confirmed' ? chalk.green('✅') :
                      launch.status === 'failed' ? chalk.red('❌') :
                      chalk.yellow('⏳');
        
        console.log(`${status} ${index + 1}. ${launch.name} (${launch.symbol})`);
        console.log(`   Address: ${launch.tokenAddress}`);
        console.log(`   Creator: ${launch.creator}`);
        console.log(`   Date: ${date}`);
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate deployment report')
  .option('-c, --creator <address>', 'Filter by creator address')
  .action(async (options) => {
    try {
      const report = await launchManager.generateReport(options.creator);
      console.log(report);
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export launch data')
  .option('-f, --format <format>', 'Export format (json|csv)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    try {
      const data = await launchManager.exportLaunches(options.format);
      
      if (options.output) {
        await fs.writeFile(options.output, data);
        console.log(chalk.green(`Data exported to ${options.output}`));
      } else {
        console.log(data);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Clean up old deployment data')
  .option('-d, --days <number>', 'Remove deployments older than this many days', '30')
  .action(async (options) => {
    try {
      const days = parseInt(options.days);
      const removed = await launchManager.cleanupOldLaunches(days);
      console.log(chalk.green(`Removed ${removed} old deployments`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function interactiveLaunch(): Promise<TokenLaunchConfig> {
  console.log(chalk.blue('🚀 Interactive Token Launch Setup'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Token name:',
      validate: (input) => input.trim().length > 0 || 'Token name is required'
    },
    {
      type: 'input',
      name: 'symbol',
      message: 'Token symbol (max 10 chars):',
      validate: (input) => {
        if (input.trim().length === 0) return 'Token symbol is required';
        if (input.length > 10) return 'Token symbol must be 10 characters or less';
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Token description:',
      validate: (input) => input.trim().length > 0 || 'Token description is required'
    },
    {
      type: 'input',
      name: 'wallet',
      message: 'Creator wallet address:',
      validate: (input) => {
        if (!input.match(/^0x[a-fA-F0-9]{40}$/)) {
          return 'Please enter a valid Ethereum wallet address';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'imageOption',
      message: 'Token image:',
      choices: [
        { name: 'Generate automatically', value: 'generate' },
        { name: 'Upload from file', value: 'upload' }
      ]
    }
  ]);

  let imagePath: string | undefined;
  let generateImage = false;
  let imagePrompt: string | undefined;

  if (answers.imageOption === 'upload') {
    const fileAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'imagePath',
        message: 'Path to image file:',
        validate: async (input) => {
          if (!await fs.pathExists(input)) return 'File not found';
          return true;
        }
      }
    ]);
    imagePath = fileAnswer.imagePath;
  } else {
    generateImage = true;
    const promptAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'imagePrompt',
        message: 'Image generation prompt (optional):',
        default: `${answers.name} cryptocurrency token logo`
      }
    ]);
    imagePrompt = promptAnswer.imagePrompt;
  }

  // Optional fields
  const optionalAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'website',
      message: 'Website (optional):'
    },
    {
      type: 'input',
      name: 'twitter',
      message: 'Twitter handle (optional):'
    },
    {
      type: 'input',
      name: 'telegram',
      message: 'Telegram channel (optional):'
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated, optional):'
    }
  ]);

  const metadata: TokenMetadata = {
    name: answers.name,
    symbol: answers.symbol,
    description: answers.description,
    image: '', // Will be set during upload
    website: optionalAnswers.website || undefined,
    twitter: optionalAnswers.twitter || undefined,
    telegram: optionalAnswers.telegram || undefined,
    tags: optionalAnswers.tags ? optionalAnswers.tags.split(',').map(t => t.trim()) : undefined
  };

  return {
    metadata,
    creatorWallet: answers.wallet,
    imagePath,
    generateImage,
    imagePrompt
  };
}

async function parseCLIOptions(options: any): Promise<TokenLaunchConfig> {
  const metadata: TokenMetadata = {
    name: options.name,
    symbol: options.symbol,
    description: options.description,
    image: '',
    website: options.website,
    twitter: options.twitter,
    telegram: options.telegram,
    tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined
  };

  return {
    metadata,
    creatorWallet: options.wallet,
    imagePath: options.image,
    generateImage: options.generateImage,
    imagePrompt: options.prompt
  };
}

// Ensure temp directory exists
await fs.ensureDir('temp');

program.parse();