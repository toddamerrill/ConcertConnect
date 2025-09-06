import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { limit } = req.query;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const queryString = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${backendUrl}/api/events/featured/upcoming${queryString}`, {
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
    console.error('Error proxying to backend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured events' 
    });
  }
}