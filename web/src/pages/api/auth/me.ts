import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    if (req.method === 'GET') {
      // Get user profile
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user?.email}`, // Using email as temp token
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }
    
    if (req.method === 'PATCH') {
      // Update user profile
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user?.email}`,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Error proxying profile request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process profile request' 
    });
  }
}