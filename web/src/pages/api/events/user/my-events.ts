import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { type } = req.query;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const queryString = type ? `?type=${type}` : '';
    const response = await fetch(`${backendUrl}/api/events/user/my-events${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user?.email}`,
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user events' 
    });
  }
}