import express from 'express';
import { prisma } from '../lib/prisma';
import { TicketmasterService } from '../services/ticketmaster.service';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();
const ticketmasterService = new TicketmasterService();

// Search events with optional authentication
router.get('/search', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { 
      city, 
      state, 
      genre, 
      keyword, 
      startDate, 
      endDate, 
      page = 0, 
      size = 20,
      radius = 50,
      sort = 'date,asc'
    } = req.query;

    // Build search parameters
    const searchParams: any = {
      page: parseInt(page as string),
      size: Math.min(parseInt(size as string), 50), // Limit to 50 events per request
      sort: sort as string,
      radius: parseInt(radius as string)
    };

    if (city) searchParams.city = city as string;
    if (state) searchParams.stateCode = state as string;
    if (genre) searchParams.genre = genre as string;
    if (keyword) searchParams.keyword = keyword as string;

    if (startDate && endDate) {
      searchParams.dateRange = {
        start: TicketmasterService.formatDateForAPI(new Date(startDate as string)),
        end: TicketmasterService.formatDateForAPI(new Date(endDate as string))
      };
    }

    // If user is authenticated, use their location as default
    if (req.user && (!city && !state)) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { location: true }
      });

      if (user?.location && typeof user.location === 'object') {
        const location = user.location as any;
        if (location.city) searchParams.city = location.city;
        if (location.state) searchParams.stateCode = location.state;
      }
    }

    // Search external API first
    const externalResults = await ticketmasterService.searchEvents(searchParams);

    // Store new events in database
    const storedEvents = await Promise.all(
      externalResults.events.map(async (eventData) => {
        try {
          return await prisma.event.upsert({
            where: { externalId: eventData.externalId },
            update: {
              title: eventData.title,
              artistName: eventData.artistName,
              venueName: eventData.venueName,
              venueAddress: eventData.venueAddress,
              eventDate: eventData.eventDate,
              ticketUrl: eventData.ticketUrl,
              imageUrl: eventData.imageUrl,
              genre: eventData.genre,
              priceRange: eventData.priceRange,
              updatedAt: new Date()
            },
            create: {
              externalId: eventData.externalId,
              title: eventData.title,
              description: eventData.description,
              artistName: eventData.artistName,
              venueName: eventData.venueName,
              venueAddress: eventData.venueAddress,
              eventDate: eventData.eventDate,
              ticketUrl: eventData.ticketUrl,
              imageUrl: eventData.imageUrl,
              genre: eventData.genre,
              priceRange: eventData.priceRange,
              externalSource: eventData.externalSource
            }
          });
        } catch (error) {
          logger.error(`Error storing event ${eventData.externalId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validEvents = storedEvents.filter(event => event !== null);

    // If user is authenticated, add their interaction data
    let eventsWithUserData = validEvents;
    if (req.user) {
      const userInteractions = await prisma.userEvent.findMany({
        where: {
          userId: req.user.id,
          eventId: { in: validEvents.map(e => e!.id) }
        }
      });

      const interactionMap = userInteractions.reduce((acc: Record<string, string[]>, interaction) => {
        if (!acc[interaction.eventId]) {
          acc[interaction.eventId] = [];
        }
        acc[interaction.eventId].push(interaction.interactionType);
        return acc;
      }, {} as Record<string, string[]>);

      eventsWithUserData = validEvents.map((event) => ({
        ...event,
        userInteractions: interactionMap[event!.id] || []
      }));
    }

    res.json({
      success: true,
      data: {
        events: eventsWithUserData,
        pagination: externalResults.pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get event by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        userEvents: req.user ? {
          where: { userId: req.user.id }
        } : false
      }
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    // Add user interaction data if authenticated
    let eventWithUserData = { ...event };
    if (req.user && event.userEvents) {
      eventWithUserData = {
        ...event,
        userInteractions: event.userEvents.map(ue => ue.interactionType)
      };
      delete (eventWithUserData as any).userEvents;
    }

    res.json({
      success: true,
      data: { event: eventWithUserData }
    });
  } catch (error) {
    next(error);
  }
});

// Mark user interest in event
router.post('/:id/interest', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'interested', 'going', 'purchased'

    if (!['interested', 'going', 'purchased'].includes(type)) {
      throw new ValidationError('Invalid interaction type. Must be: interested, going, or purchased');
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    // Create or update user event interaction
    const userEvent = await prisma.userEvent.upsert({
      where: {
        userId_eventId_interactionType: {
          userId: req.user!.id,
          eventId: id,
          interactionType: type
        }
      },
      update: {
        createdAt: new Date()
      },
      create: {
        userId: req.user!.id,
        eventId: id,
        interactionType: type
      }
    });

    logger.info(`User ${req.user!.email} marked ${type} for event ${event.title}`);

    res.json({
      success: true,
      message: `Successfully marked as ${type}`,
      data: { userEvent }
    });
  } catch (error) {
    next(error);
  }
});

// Remove user interest in event
router.delete('/:id/interest/:type', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id, type } = req.params;

    if (!['interested', 'going', 'purchased'].includes(type)) {
      throw new ValidationError('Invalid interaction type');
    }

    const deleted = await prisma.userEvent.deleteMany({
      where: {
        userId: req.user!.id,
        eventId: id,
        interactionType: type
      }
    });

    if (deleted.count === 0) {
      throw new NotFoundError('User event interaction');
    }

    res.json({
      success: true,
      message: `Successfully removed ${type} status`
    });
  } catch (error) {
    next(error);
  }
});

// Get user's events (interested, going, purchased)
router.get('/user/my-events', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { type } = req.query; // Filter by interaction type

    const whereClause: any = {
      userId: req.user!.id
    };

    if (type && ['interested', 'going', 'purchased'].includes(type as string)) {
      whereClause.interactionType = type;
    }

    const userEvents = await prisma.userEvent.findMany({
      where: whereClause,
      include: {
        event: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by interaction type
    const groupedEvents = userEvents.reduce((acc, userEvent) => {
      if (!acc[userEvent.interactionType]) {
        acc[userEvent.interactionType] = [];
      }
      acc[userEvent.interactionType].push({
        ...userEvent.event,
        interactionDate: userEvent.createdAt
      });
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      data: {
        events: groupedEvents,
        total: userEvents.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get available genres
router.get('/meta/genres', (req, res) => {
  const genres = ticketmasterService.getAvailableGenres();
  
  res.json({
    success: true,
    data: { genres }
  });
});

// Get upcoming events (featured/recommended)
router.get('/featured/upcoming', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get upcoming events from database
    const upcomingEvents = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: new Date()
        },
        isActive: true
      },
      orderBy: {
        eventDate: 'asc'
      },
      take: parseInt(limit as string),
      include: req.user ? {
        userEvents: {
          where: { userId: req.user.id }
        }
      } : undefined
    });

    // Add user interaction data if authenticated
    const eventsWithUserData = upcomingEvents.map(event => {
      if (req.user && event.userEvents) {
        return {
          ...event,
          userInteractions: event.userEvents.map(ue => ue.interactionType),
          userEvents: undefined
        };
      }
      return event;
    });

    res.json({
      success: true,
      data: { events: eventsWithUserData }
    });
  } catch (error) {
    next(error);
  }
});

export { router as eventRoutes };