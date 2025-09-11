import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const queryParams = new URLSearchParams();
    
    // Forward all query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        queryParams.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      }
    });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/events/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying search to backend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search events' 
    });
  }
}