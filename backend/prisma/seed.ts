import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: true,
      location: {
        city: 'Columbia',
        state: 'SC',
        country: 'US',
        latitude: 34.0007,
        longitude: -81.0348
      },
      musicPreferences: {
        genres: ['rock', 'pop', 'indie'],
        maxEventPrice: 150
      }
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      passwordHash: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      isEmailVerified: true,
      location: {
        city: 'Charlotte',
        state: 'NC',
        country: 'US',
        latitude: 35.2271,
        longitude: -80.8431
      },
      musicPreferences: {
        genres: ['pop', 'electronic', 'hip-hop'],
        maxEventPrice: 200
      }
    }
  });

  // Create sample events
  const event1 = await prisma.event.upsert({
    where: { externalId: 'tm_12345' },
    update: {},
    create: {
      externalId: 'tm_12345',
      title: 'Rock Concert at Colonial Life Arena',
      description: 'Amazing rock concert featuring local and national bands',
      artistName: 'The Rock Band',
      venueName: 'Colonial Life Arena',
      venueAddress: {
        street: '801 Lincoln St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29201',
        latitude: 34.0007,
        longitude: -81.0348
      },
      eventDate: new Date('2024-03-15T20:00:00Z'),
      ticketUrl: 'https://ticketmaster.com/event/12345',
      imageUrl: 'https://example.com/concert-image.jpg',
      genre: 'rock',
      priceRange: {
        min: 35,
        max: 150,
        currency: 'USD'
      },
      externalSource: 'ticketmaster'
    }
  });

  const event2 = await prisma.event.upsert({
    where: { externalId: 'tm_67890' },
    update: {},
    create: {
      externalId: 'tm_67890',
      title: 'Pop Music Festival',
      description: 'Three-day pop music festival with top artists',
      artistName: 'Various Artists',
      venueName: 'Spectrum Center',
      venueAddress: {
        street: '333 E Trade St',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28202',
        latitude: 35.2271,
        longitude: -80.8431
      },
      eventDate: new Date('2024-04-20T18:00:00Z'),
      ticketUrl: 'https://ticketmaster.com/event/67890',
      imageUrl: 'https://example.com/festival-image.jpg',
      genre: 'pop',
      priceRange: {
        min: 75,
        max: 300,
        currency: 'USD'
      },
      externalSource: 'ticketmaster'
    }
  });

  // Create friendship between users
  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: user1.id,
        addresseeId: user2.id
      }
    },
    update: {},
    create: {
      requesterId: user1.id,
      addresseeId: user2.id,
      status: 'accepted'
    }
  });

  // Create user event interactions
  await prisma.userEvent.upsert({
    where: {
      userId_eventId_interactionType: {
        userId: user1.id,
        eventId: event1.id,
        interactionType: 'going'
      }
    },
    update: {},
    create: {
      userId: user1.id,
      eventId: event1.id,
      interactionType: 'going'
    }
  });

  await prisma.userEvent.upsert({
    where: {
      userId_eventId_interactionType: {
        userId: user2.id,
        eventId: event2.id,
        interactionType: 'interested'
      }
    },
    update: {},
    create: {
      userId: user2.id,
      eventId: event2.id,
      interactionType: 'interested'
    }
  });

  // Create sample music taste data
  await prisma.userMusicTaste.upsert({
    where: {
      userId_artistName: {
        userId: user1.id,
        artistName: 'The Beatles'
      }
    },
    update: {},
    create: {
      userId: user1.id,
      spotifyArtistId: '3WrFJ7ztbogyGnTHbHJFl2',
      artistName: 'The Beatles',
      genre: 'rock',
      preferenceScore: 0.9
    }
  });

  // Create sample restaurant partner
  await prisma.restaurantPartner.upsert({
    where: { id: 'restaurant-1' },
    update: {},
    create: {
      id: 'restaurant-1',
      name: 'Concert Cafe',
      address: {
        street: '123 Main St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29201'
      },
      contactInfo: {
        phone: '(803) 555-0123',
        email: 'info@concertcafe.com'
      },
      discountPercentage: 15.0,
      qrCodeUrl: 'https://example.com/qr/restaurant-1'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created users: ${user1.email}, ${user2.email}`);
  console.log(`🎵 Created events: ${event1.title}, ${event2.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });