import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3001;

// In-memory cache for price data
let priceCache = {
  price: null,
  lastUpdated: null,
  up: false,
  cacheExpiry: null
};

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map();

// Get current ETH price from CoinGecko API
const getCurrentETHPrice = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
      headers: {
        'x-cg-demo-api-key': 'CG-Jx4xDfpSpW3NfjT8hqcxxzgh'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const currentPrice = data.ethereum.usd;
    
    console.log(`Fetched current ETH price: $${currentPrice}`);
    return currentPrice;
    
  } catch (error) {
    console.error('Error fetching ETH price from CoinGecko:', error);
    
    // Fallback to cached price or default if API fails
    if (priceCache.price) {
      console.log('Using cached ETH price as fallback');
      return priceCache.price;
    }
    throw error;
  }
};

// Simulate price changes
const simulatePriceChange = (currentPrice) => {
  // Generate random change between -2% and +2%
  const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
  const newPrice = currentPrice * (1 + changePercent / 100);
  const up = newPrice > currentPrice;
  
  return {
    price: parseFloat(newPrice.toFixed(2)),
    up: up
  };
};

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
  // Skip rate limiting for the clear-rate-limits endpoint
  if (req.path === '/api/clear-rate-limits') {
    return next();
  }
  
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    // Reset the window
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (clientData.count >= maxRequests) {
    console.log(`Rate limit exceeded for IP: ${clientIP}. Count: ${clientData.count}/${maxRequests}`);
    return res.status(429).json({
      error: 'Rate limit exceeded. Max 10 requests per minute.'
    });
  }
  
  clientData.count++;
  rateLimitMap.set(clientIP, clientData);
  next();
};

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true
}));

app.use(express.json());
app.use(rateLimiter);

// ETH Price endpoint
app.get('/api/eth-price', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check if cached price is still valid (6 seconds)
    if (priceCache.cacheExpiry && now < priceCache.cacheExpiry) {
      return res.json({
        price: priceCache.price,
        lastUpdated: priceCache.lastUpdated,
        up: priceCache.up
      });
    }
    
    // Get current price and simulate change
    const currentPrice = await getCurrentETHPrice();
    const { price: newPrice, up } = simulatePriceChange(currentPrice);
    
    // Update cache
    priceCache = {
      price: newPrice,
      lastUpdated: new Date().toISOString(),
      up: up,
      cacheExpiry: now + 6000 // 6 seconds
    };
    
    res.json({
      price: priceCache.price,
      lastUpdated: priceCache.lastUpdated,
      up: priceCache.up
    });
    
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to clear rate limits (development only)
app.get('/api/clear-rate-limits', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const previousCount = rateLimitMap.get(clientIP)?.count || 0;
  rateLimitMap.clear();
  console.log(`Rate limit cache cleared by IP: ${clientIP} (was at ${previousCount} requests)`);
  res.json({ 
    message: 'Rate limit cache cleared',
    previousCount: previousCount,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`ETH Price API server running on port ${PORT}`);
}); 