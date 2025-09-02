import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;
const API_BASE_URL = 'https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Proxy endpoint for participant data
app.get('/api/participant/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${API_BASE_URL}/participant/${id}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Fuelltreffer-Backend/1.0'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching participant data:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'API Error',
        message: error.response.data?.message || 'Unknown API error'
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        error: 'Timeout',
        message: 'Request timeout'
      });
    } else {
      res.status(500).json({
        error: 'Server Error',
        message: 'Internal server error'
      });
    }
  }
});

// General proxy endpoint for other 2k software API calls
app.get('/api/proxy/*', async (req, res) => {
  try {
    const path = req.params[0];
    const queryString = req.url.split('?')[1];
    const url = `${API_BASE_URL}/${path}${queryString ? '?' + queryString : ''}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Fuelltreffer-Backend/1.0'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error in proxy request:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'API Error',
        message: error.response.data?.message || 'Unknown API error'
      });
    } else {
      res.status(500).json({
        error: 'Server Error',
        message: 'Internal server error'
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Proxying requests to: ${API_BASE_URL}`);
});