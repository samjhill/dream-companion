import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';
import './DreamArt.css';

// Constants
const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

interface Dream {
  id: string;
  createdAt: string;
  dream_content: string;
  response?: string;
  summary?: string;
  analysis?: string;
  interpretation?: string;
  ai_response?: string;
  dream_analysis?: string;
  insights?: string;
}

interface DreamArtProps {
  className?: string;
  onArtReady?: (artConfig: ArtConfig | null, dreamCount: number, canvasRef: React.RefObject<HTMLCanvasElement>) => void;
}

interface ArtConfig {
  style: 'minimal' | 'flowing' | 'cosmic' | 'forest' | 'ocean' | 'fire';
  colors: string[];
  patterns: {
    circles: boolean;
    lines: boolean;
    spirals: boolean;
    waves: boolean;
    stars: boolean;
  };
  intensity: number;
  complexity: number;
}

const DreamArt: React.FC<DreamArtProps> = ({ className = '', onArtReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artConfig, setArtConfig] = useState<ArtConfig | null>(null);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastFrameTime = useRef<number>(0);

  // Fetch user's dreams for art generation
  const fetchDreams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();

      if (!phoneNumber) {
        setError("No phone number found");
        return;
      }

      // Fetch a sample of dreams for analysis (limit to 50 for performance)
      const response = await fetch(
        `${API_BASE_URL}/api/dreams/${phoneNumber.replace("+", "")}?limit=50&offset=0`,
        { headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dreams: ${response.status}`);
      }

      const data = await response.json();
      
      // For art generation, we only need basic info
      const dreamPromises = data.dreams.slice(0, 20).map(async (dream: any) => {
        try {
          const dreamResponse = await fetch(
            `${API_BASE_URL}/api/dreams/${phoneNumber.replace("+", "")}/${dream.key.split('/').pop()?.replace('.json', '')}`,
            { headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` } }
          );
          if (dreamResponse.ok) {
            return await dreamResponse.json();
          }
        } catch (error) {
          console.warn('Failed to fetch individual dream:', error);
        }
        return null;
      });

      const dreamResults = await Promise.all(dreamPromises);
      const validDreams = dreamResults.filter((dream): dream is Dream => dream !== null);
      
      setDreams(validDreams);
    } catch (error) {
      console.error("Error fetching dreams for art:", error);
      setError("Failed to load dream data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyze dreams to determine art configuration
  const analyzeDreamsForArt = useCallback((dreams: Dream[]): ArtConfig => {
    if (dreams.length === 0) {
      return {
        style: 'minimal',
        colors: ['#E8F4FD', '#B8E6FF', '#87CEEB'],
        patterns: { circles: true, lines: false, spirals: false, waves: false, stars: false },
        intensity: 0.3,
        complexity: 0.2
      };
    }

    const dreamCount = dreams.length;
    const dreamTimes = dreams.map(dream => new Date(dream.createdAt));
    
    // Analyze timing patterns
    const hourDistribution = new Array(24).fill(0);
    dreamTimes.forEach(time => {
      hourDistribution[time.getHours()]++;
    });
    
    // const mostActiveHour = hourDistribution.indexOf(Math.max(...hourDistribution));
    
    // Analyze content themes
    const allContent = dreams.map(d => `${d.dream_content} ${d.summary}`).join(' ').toLowerCase();
    const hasWaterThemes = /\b(water|ocean|sea|river|lake|rain|swimming|drowning)\b/.test(allContent);
    const hasFireThemes = /\b(fire|flame|burning|heat|light|sun|bright)\b/.test(allContent);
    const hasNatureThemes = /\b(tree|forest|mountain|earth|ground|plant|flower|animal)\b/.test(allContent);
    const hasSpaceThemes = /\b(space|star|moon|planet|sky|cosmic|universe|galaxy)\b/.test(allContent);
    const hasFlyingThemes = /\b(flying|flight|soaring|floating|air|wind)\b/.test(allContent);

    // Determine art style based on analysis
    let style: ArtConfig['style'] = 'minimal';
    let colors: string[] = [];
    let patterns: ArtConfig['patterns'];

    if (dreamCount < 5) {
      style = 'minimal';
      colors = ['#F0F8FF', '#E6F3FF', '#CCE7FF'];
    } else if (dreamCount < 15) {
      style = 'flowing';
      colors = ['#E8F4FD', '#B8E6FF', '#87CEEB', '#4682B4'];
    } else if (dreamCount < 30) {
      style = 'cosmic';
      colors = ['#191970', '#4169E1', '#87CEEB', '#F0F8FF'];
    } else {
      style = 'cosmic';
      colors = ['#000080', '#4169E1', '#87CEEB', '#F0F8FF', '#FFD700'];
    }

    // Override style based on content themes
    if (hasWaterThemes) {
      style = 'ocean';
      colors = ['#001F3F', '#0074D9', '#7FDBFF', '#E6F3FF'];
    } else if (hasFireThemes) {
      style = 'fire';
      colors = ['#FF4500', '#FF6347', '#FFD700', '#FFF8DC'];
    } else if (hasNatureThemes) {
      style = 'forest';
      colors = ['#228B22', '#32CD32', '#90EE90', '#F0FFF0'];
    } else if (hasSpaceThemes || hasFlyingThemes) {
      style = 'cosmic';
      colors = ['#191970', '#4169E1', '#87CEEB', '#F0F8FF', '#FFD700'];
    }

    // Determine patterns based on dream characteristics
    patterns = {
      circles: dreamCount > 0,
      lines: dreamCount > 3,
      spirals: dreamCount > 8,
      waves: hasWaterThemes || dreamCount > 12,
      stars: hasSpaceThemes || dreamCount > 20
    };

    // Calculate intensity and complexity
    const intensity = Math.min(0.2 + (dreamCount * 0.02), 1.0);
    const complexity = Math.min(0.1 + (dreamCount * 0.015), 0.8);

    return {
      style,
      colors,
      patterns,
      intensity,
      complexity
    };
  }, []);

  // Generate art based on configuration
  const generateArt = useCallback((ctx: CanvasRenderingContext2D, config: ArtConfig, mouseX: number, mouseY: number) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Always draw background first to prevent black flashing
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, config.colors[0]);
    gradient.addColorStop(1, config.colors[config.colors.length - 1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add patterns based on configuration
    if (config.patterns.circles) {
      drawCircles(ctx, config, width, height, mouseX, mouseY);
    }
    
    if (config.patterns.lines) {
      drawLines(ctx, config, width, height, mouseX, mouseY);
    }
    
    if (config.patterns.spirals) {
      drawSpirals(ctx, config, width, height, mouseX, mouseY);
    }
    
    if (config.patterns.waves) {
      drawWaves(ctx, config, width, height, mouseX, mouseY);
    }
    
    if (config.patterns.stars) {
      drawStars(ctx, config, width, height, mouseX, mouseY);
    }
  }, []);

  // Drawing functions for different patterns
  const drawCircles = (ctx: CanvasRenderingContext2D, config: ArtConfig, width: number, height: number, mouseX: number, mouseY: number) => {
    const circleCount = Math.floor(config.complexity * 8) + 3; // Reduced count
    
    for (let i = 0; i < circleCount; i++) {
      // More stable positioning with gentle movement
      const x = (width / circleCount) * i + (Math.sin(Date.now() * 0.0003 + i) * 30); // Much slower
      const y = height / 2 + (Math.cos(Date.now() * 0.0002 + i) * 20); // Gentle movement
      const baseRadius = 15 + (config.intensity * 25);
      
      // Mouse interaction - circles grow when mouse is near
      const distanceToMouse = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
      const mouseInfluence = Math.max(0, 1 - distanceToMouse / 150);
      
      // Very gentle pulsing
      const pulse = Math.sin(Date.now() * 0.0008 + i) * 0.1 + 0.9; // Subtle pulse
      
      ctx.beginPath();
      ctx.arc(x, y, baseRadius * (1 + mouseInfluence * 0.8 + pulse * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = config.colors[i % config.colors.length];
      ctx.globalAlpha = 0.2 + (config.intensity * 0.3) + (mouseInfluence * 0.4);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const drawLines = (ctx: CanvasRenderingContext2D, config: ArtConfig, width: number, height: number, _mouseX: number, _mouseY: number) => {
    const lineCount = Math.floor(config.complexity * 8) + 2; // Reduced count
    
    for (let i = 0; i < lineCount; i++) {
      const startX = (width / lineCount) * i;
      const startY = height * 0.3 + (Math.sin(Date.now() * 0.0002 + i) * 50); // Much slower
      const endX = startX + (Math.cos(Date.now() * 0.0003 + i) * 100); // Slower movement
      const endY = height * 0.7 + (Math.sin(Date.now() * 0.0002 + i) * 50);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = config.colors[i % config.colors.length];
      ctx.lineWidth = 1.5 + (config.intensity * 2);
      ctx.globalAlpha = 0.3 + (config.intensity * 0.2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  const drawSpirals = (ctx: CanvasRenderingContext2D, config: ArtConfig, width: number, height: number, _mouseX: number, _mouseY: number) => {
    const spiralCount = Math.floor(config.complexity * 4) + 1; // Reduced count
    
    for (let i = 0; i < spiralCount; i++) {
      const centerX = (width / spiralCount) * i + width / (spiralCount * 2);
      const centerY = height / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      
      for (let angle = 0; angle < Math.PI * 3; angle += 0.15) { // Slower spiral
        const radius = angle * 1.5 + (Math.sin(Date.now() * 0.0005 + i) * 10); // Much slower movement
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = config.colors[i % config.colors.length];
      ctx.lineWidth = 1 + (config.intensity * 1.5);
      ctx.globalAlpha = 0.2 + (config.intensity * 0.3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  const drawWaves = (ctx: CanvasRenderingContext2D, config: ArtConfig, width: number, height: number, _mouseX: number, _mouseY: number) => {
    const waveCount = Math.floor(config.complexity * 3) + 1; // Reduced count
    
    for (let i = 0; i < waveCount; i++) {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      for (let x = 0; x < width; x += 8) { // Larger steps for smoother waves
        const y = height / 2 + 
          Math.sin((x * 0.008) + (Date.now() * 0.0003 + i)) * (20 + config.intensity * 30) + // Much slower
          Math.sin((x * 0.015) + (Date.now() * 0.0005 + i)) * (8 + config.intensity * 12);
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = config.colors[i % config.colors.length];
      ctx.lineWidth = 1.5 + (config.intensity * 2);
      ctx.globalAlpha = 0.3 + (config.intensity * 0.2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  const drawStars = (ctx: CanvasRenderingContext2D, config: ArtConfig, width: number, height: number, mouseX: number, mouseY: number) => {
    const starCount = Math.floor(config.complexity * 15) + 5; // Reduced count
    
    for (let i = 0; i < starCount; i++) {
      // Use consistent positioning based on index for stable stars
      const x = (width / starCount) * i + (Math.sin(Date.now() * 0.0005 + i) * 20); // Much slower movement
      const y = height * 0.3 + (Math.cos(Date.now() * 0.0003 + i) * 15); // Gentle vertical drift
      const baseSize = 1.5 + (config.intensity * 2);
      
      // Mouse interaction - stars respond to mouse proximity
      const distanceToMouse = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
      const mouseInfluence = Math.max(0, 1 - distanceToMouse / 200); // Larger interaction radius
      
      // Very gentle twinkle - much slower
      const twinkle = Math.sin(Date.now() * 0.001 + i) * 0.2 + 0.8; // Subtle twinkle
      
      ctx.beginPath();
      ctx.arc(x, y, baseSize * (1 + mouseInfluence * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = config.colors[i % config.colors.length];
      ctx.globalAlpha = 0.4 + (twinkle * 0.2) + (mouseInfluence * 0.3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  // Animation loop with frame rate limiting for gentler animation
  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !artConfig) return;

    // Limit to ~30fps for gentler animation
    if (currentTime - lastFrameTime.current < 33) {
      const id = requestAnimationFrame(animate);
      setAnimationId(id);
      return;
    }
    
    lastFrameTime.current = currentTime;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    generateArt(ctx, artConfig, mousePos.x, mousePos.y);
    
    const id = requestAnimationFrame(animate);
    setAnimationId(id);
  }, [artConfig, mousePos, generateArt]);

  // Handle mouse movement
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePos({ x, y });
  }, []);

  // Initialize canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Draw initial background to prevent black flash
        const ctx = canvas.getContext('2d');
        if (ctx && artConfig) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, artConfig.colors[0]);
          gradient.addColorStop(1, artConfig.colors[artConfig.colors.length - 1]);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    // Initial resize
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animationId, artConfig]);

  // Start animation when art config is ready
  useEffect(() => {
    if (artConfig && !animationId) {
      const id = requestAnimationFrame(animate);
      setAnimationId(id);
    }
  }, [artConfig, animate, animationId]);

  // Fetch dreams and generate art config
  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  // Update art config when dreams change
  useEffect(() => {
    if (dreams.length >= 0) { // Include empty state
      const config = analyzeDreamsForArt(dreams);
      setArtConfig(config);
      // Notify parent component when art is ready
      if (onArtReady) {
        onArtReady(config, dreams.length, canvasRef);
      }
    }
  }, [dreams, analyzeDreamsForArt, onArtReady]);

  if (loading) {
    console.log('DreamArt: Loading state');
    return (
      <div className={`dream-art-container ${className}`}>
        <div className="dream-art-loading">
          <div className="loading-spinner"></div>
          <p>Generating your unique dream art...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dream-art-container ${className}`}>
        <div className="dream-art-error">
          <p>Unable to generate art: {error}</p>
        </div>
      </div>
    );
  }

  console.log('DreamArt: Rendering with', dreams.length, 'dreams, artConfig:', artConfig);
  
  return (
    <div className={`dream-art-container ${className}`}>
      <div className="dream-art-info">
        <p>
          {dreams.length === 0 
            ? "Your canvas awaits your first dream..."
            : `Inspired by ${dreams.length} dream${dreams.length === 1 ? '' : 's'}`
          }
        </p>
        {artConfig && (
          <div className="art-style-info">
            <span className="art-style-badge">{artConfig.style}</span>
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="dream-art-canvas"
        onMouseMove={handleMouseMove}
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
};

export default DreamArt;
