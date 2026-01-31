# 🤖 Agent Token Launcher

AI-powered token launcher for pump.fun that enables autonomous agents to create and deploy their own cryptocurrency tokens with custom metadata and images.

## 🚀 Features

- **Automated Token Creation**: Launch tokens on pump.fun with a single command
- **AI-Generated Images**: Automatically generate token logos using AI
- **Metadata Management**: Handle token metadata and IPFS uploads
- **Deployment Tracking**: Track all token launches with detailed analytics
- **CLI Interface**: Easy-to-use command-line interface
- **Agent-Friendly**: Designed for AI agents to launch tokens autonomously

## 📦 Installation

```bash
npm install -g agent-token-launcher
```

Or for local development:

```bash
git clone https://github.com/your-username/agent-token-launcher.git
cd agent-token-launcher
npm install
npm run build
npm link
```

## 🎯 Quick Start

### Interactive Launch
```bash
agent-launch launch
```

### Launch with Parameters
```bash
agent-launch launch \
  --name "AI Agent Coin" \
  --symbol "AICOIN" \
  --description "Token created by autonomous AI agent" \
  --wallet "0x123..." \
  --generate-image \
  --prompt "Futuristic AI robot holding a coin"
```

### Simulate a Launch (for testing)
```bash
agent-launch launch \
  --name "Test Token" \
  --symbol "TEST" \
  --description "Test token" \
  --wallet "0x123..." \
  --simulate
```

## 📋 Commands

### Launch Commands
- `launch` - Launch a new token (interactive or with flags)
- `status <token-address>` - Get token launch status
- `stats [creator-address]` - View launch statistics

### History & Reports
- `history` - View recent launches
- `report` - Generate deployment report
- `export` - Export launch data (JSON/CSV)

### Management
- `cleanup` - Clean up old deployment data

## 🛠️ Configuration

### Token Metadata
```typescript
interface TokenMetadata {
  name: string;           // Token name
  symbol: string;         // Token symbol (max 10 chars)
  description: string;    // Token description
  image: string;          // Image URL or path
  website?: string;       // Optional website
  twitter?: string;       // Optional Twitter handle
  telegram?: string;      // Optional Telegram channel
  tags?: string[];        // Optional tags
}
```

### Launch Configuration
```typescript
interface TokenLaunchConfig {
  metadata: TokenMetadata;
  creatorWallet: string;  // Creator wallet address
  imagePath?: string;     // Path to token image
  generateImage?: boolean; // Auto-generate image
  imagePrompt?: string;   // Prompt for image generation
}
```

## 🔧 API Usage

### Programmatic Launch
```typescript
import { LaunchManager } from 'agent-token-launcher';

const launchManager = LaunchManager.getInstance();

const config = {
  metadata: {
    name: "My AI Token",
    symbol: "AITOKEN",
    description: "Created by AI agent",
    image: ""
  },
  creatorWallet: "0x123...",
  generateImage: true,
  imagePrompt: "AI token logo"
};

const result = await launchManager.launchToken(config);
```

### Image Generation
```typescript
import { ImageGenerator } from 'agent-token-launcher';

const generator = ImageGenerator.getInstance();

const options = {
  prompt: "Cyberpunk robot holding crypto",
  style: 'cartoon',
  width: 512,
  height: 512
};

const imagePath = await generator.generateTokenImage(options);
```

## 📊 Deployment Tracking

The launcher automatically tracks all deployments with:
- Token addresses and metadata
- Creator information
- Launch timestamps
- Success/failure status
- Detailed analytics

Access tracking data through:
```bash
agent-launch history
agent-launch stats
agent-launch report
```

## 🎨 Image Generation Styles

Supported styles for AI-generated token images:
- `cartoon` - Colorful, cartoon-style logos
- `realistic` - Photorealistic style
- `minimalist` - Clean, simple designs
- `pixel` - Retro pixel art style

## 🔒 Security

- Private keys are never stored
- All transactions are signed locally
- Secure metadata upload to IPFS
- No sensitive data logged

## 🚨 Important Notes

- **Mainnet Only**: This tool is designed for mainnet deployments
- **Real SOL Required**: Token launches require real SOL for fees
- **Irreversible**: Token deployments cannot be undone
- **Pump.fun Integration**: Uses pump.fun's bonding curve mechanism

## 🐛 Error Handling

The launcher includes comprehensive error handling for:
- Invalid wallet addresses
- Missing required fields
- Network connectivity issues
- Image generation failures
- Pump.fun API errors

## 📚 Examples

### Launch an AI Agent Token
```bash
agent-launch launch \
  --name "StarkBot Agent" \
  --symbol "STARK" \
  --description "Autonomous AI agent token by StarkBot" \
  --wallet "0x123..." \
  --generate-image \
  --prompt "Futuristic AI assistant with crypto theme" \
  --website "https://starkbot.ai" \
  --twitter "@StarkBotAI" \
  --tags "ai,agent,crypto,autonomous"
```

### Get Launch Statistics
```bash
agent-launch stats 0x123...
```

### Export Deployment History
```bash
agent-launch export --format csv --output launches.csv
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Create an issue on GitHub
- Check the documentation
- Review example configurations

---

**Built for AI agents, by AI agents. 🤖**