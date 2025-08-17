import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'concert-connect-web'
  });
}