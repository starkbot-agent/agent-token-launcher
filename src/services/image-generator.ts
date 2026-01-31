import { promises as fs } from 'fs';
import path from 'path';
import { ImageGenerationOptions } from '../types';

export class ImageGenerator {
  private static instance: ImageGenerator;

  private constructor() {
    // Initialize any required resources
  }

  public static getInstance(): ImageGenerator {
    if (!ImageGenerator.instance) {
      ImageGenerator.instance = new ImageGenerator();
    }
    return ImageGenerator.instance;
  }

  public async generateTokenImage(options: ImageGenerationOptions): Promise<string> {
    try {
      const { prompt, style = 'cartoon', width = 512, height = 512, outputPath } = options;
      
      // Generate a simple placeholder image for now
      // In a real implementation, this would integrate with an AI image generation service
      // like DALL-E, Stable Diffusion, or similar
      
      const imageBuffer = this.createPlaceholderImage(width, height, prompt, style);
      
      // Save image to file
      const timestamp = Date.now();
      const filename = `token-${timestamp}.png`;
      const imagePath = outputPath || path.join(process.cwd(), filename);
      
      await fs.writeFile(imagePath, imageBuffer);
      
      console.log(`🎨 Generated token image: ${imagePath}`);
      console.log(`   Prompt: ${prompt}`);
      console.log(`   Style: ${style}`);
      
      return imagePath;
    } catch (error) {
      throw new Error(`Failed to generate token image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createPlaceholderImage(width: number, height: number, prompt: string, style: string): Buffer {
    // This is a simplified placeholder implementation
    // In a real scenario, you would integrate with an actual AI image generation service
    
    // For now, we'll create a simple SVG that looks like a token logo
    const svgContent = this.createTokenSVG(width, height, prompt, style);
    
    // Convert SVG to PNG (simplified - in reality you'd use a proper SVG to PNG converter)
    // For this implementation, we'll return a placeholder buffer
    
    // Create a simple PNG buffer with basic metadata
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG signature
    const ihdr = Buffer.concat([
      Buffer.from([0x49, 0x48, 0x44, 0x52]), // IHDR
      this.intToBytes(width),
      this.intToBytes(height),
      Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]), // 8 bits, RGB, no interlace
      Buffer.from([0x90, 0x77, 0x53, 0xDE]) // CRC
    ]);
    
    // Simplified IDAT chunk (actual image data would go here)
    const idat = Buffer.concat([
      Buffer.from([0x49, 0x44, 0x41, 0x54]),
      Buffer.from([0x08, 0x99]), // compression method
      Buffer.from([0x01, 0x00, 0x00, 0x05, 0x00, 0x01]), // compressed data
      Buffer.from([0x0D, 0x0A, 0x2D, 0xB4]) // CRC
    ]);
    
    const iend = Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
    
    return Buffer.concat([pngSignature, ihdr, idat, iend]);
  }

  private createTokenSVG(width: number, height: number, prompt: string, style: string): string {
    const colors = this.getStyleColors(style);
    const text = this.extractTextFromPrompt(prompt);
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="tokenGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </radialGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Token background -->
        <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.4}" 
                fill="url(#tokenGradient)" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>
        
        <!-- Token text -->
        <text x="${width/2}" y="${height/2}" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.15}" 
              fill="${colors.text}" font-weight="bold">
          ${text}
        </text>
        
        <!-- Decorative elements based on style -->
        ${this.getStyleDecorations(style, width, height)}
      </svg>
    `.trim();
  }

  private getStyleColors(style: string): { primary: string; secondary: string; text: string } {
    const colorSchemes = {
      cartoon: { primary: '#FF6B6B', secondary: '#4ECDC4', text: '#FFFFFF' },
      realistic: { primary: '#FFD700', secondary: '#FFA500', text: '#8B4513' },
      minimalist: { primary: '#2C3E50', secondary: '#34495E', text: '#ECF0F1' },
      pixel: { primary: '#E74C3C', secondary: '#C0392B', text: '#F39C12' }
    };
    
    return colorSchemes[style as keyof typeof colorSchemes] || colorSchemes.cartoon;
  }

  private extractTextFromPrompt(prompt: string): string {
    // Extract relevant text for the token logo
    const words = prompt.split(' ');
    const keyWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'token', 'coin'].includes(word.toLowerCase())
    );
    
    if (keyWords.length >= 2) {
      return keyWords.slice(0, 2).map(word => word[0].toUpperCase()).join('');
    } else if (keyWords.length === 1) {
      return keyWords[0].slice(0, 2).toUpperCase();
    } else {
      return 'TK';
    }
  }

  private getStyleDecorations(style: string, width: number, height: number): string {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    switch (style) {
      case 'cartoon':
        return `
          <circle cx="${centerX - radius * 0.3}" cy="${centerY - radius * 0.3}" r="${radius * 0.1}" fill="#FFFFFF" opacity="0.8"/>
          <circle cx="${centerX + radius * 0.3}" cy="${centerY - radius * 0.3}" r="${radius * 0.1}" fill="#FFFFFF" opacity="0.8"/>
        `;
      
      case 'realistic':
        return `
          <ellipse cx="${centerX}" cy="${centerY + radius * 0.2}" rx="${radius * 0.6}" ry="${radius * 0.1}" fill="#000000" opacity="0.3"/>
        `;
      
      case 'minimalist':
        return `
          <rect x="${centerX - radius * 0.8}" y="${centerY - radius * 0.1}" width="${radius * 1.6}" height="${radius * 0.2}" fill="#FFFFFF" opacity="0.2"/>
        `;
      
      case 'pixel':
        return `
          <rect x="${centerX - radius * 0.5}" y="${centerY - radius * 0.5}" width="${radius * 0.2}" height="${radius * 0.2}" fill="#FFFFFF"/>
          <rect x="${centerX + radius * 0.3}" y="${centerY - radius * 0.5}" width="${radius * 0.2}" height="${radius * 0.2}" fill="#FFFFFF"/>
          <rect x="${centerX - radius * 0.5}" y="${centerY + radius * 0.3}" width="${radius * 0.2}" height="${radius * 0.2}" fill="#FFFFFF"/>
          <rect x="${centerX + radius * 0.3}" y="${centerY + radius * 0.3}" width="${radius * 0.2}" height="${radius * 0.2}" fill="#FFFFFF"/>
        `;
      
      default:
        return '';
    }
  }

  private intToBytes(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value);
    return buffer;
  }

  public async cleanupImage(imagePath: string): Promise<void> {
    try {
      await fs.unlink(imagePath);
      console.log(`🧹 Cleaned up image: ${imagePath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to cleanup image ${imagePath}:`, error);
    }
  }

  public validateImageOptions(options: ImageGenerationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.prompt || options.prompt.trim().length === 0) {
      errors.push('Image prompt is required');
    }

    if (options.width && (options.width < 64 || options.width > 2048)) {
      errors.push('Image width must be between 64 and 2048 pixels');
    }

    if (options.height && (options.height < 64 || options.height > 2048)) {
      errors.push('Image height must be between 64 and 2048 pixels');
    }

    const validStyles = ['cartoon', 'realistic', 'minimalist', 'pixel'];
    if (options.style && !validStyles.includes(options.style)) {
      errors.push(`Invalid style. Must be one of: ${validStyles.join(', ')}`);
    }

    const validQualities = ['low', 'medium', 'high'];
    if (options.quality && !validQualities.includes(options.quality)) {
      errors.push(`Invalid quality. Must be one of: ${validQualities.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}