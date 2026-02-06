import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Major US airports for seeding
const airports = [
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'USA', latitude: 33.6407, longitude: -84.4277, timezone: 'America/New_York' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA', latitude: 33.9425, longitude: -118.4081, timezone: 'America/Los_Angeles' },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'USA', latitude: 41.9742, longitude: -87.9073, timezone: 'America/Chicago' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'USA', latitude: 32.8998, longitude: -97.0403, timezone: 'America/Chicago' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'USA', latitude: 39.8561, longitude: -104.6737, timezone: 'America/Denver' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA', latitude: 40.6413, longitude: -73.7781, timezone: 'America/New_York' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA', latitude: 37.6213, longitude: -122.3790, timezone: 'America/Los_Angeles' },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'USA', latitude: 47.4502, longitude: -122.3088, timezone: 'America/Los_Angeles' },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'USA', latitude: 36.0840, longitude: -115.1537, timezone: 'America/Los_Angeles' },
  { code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'USA', latitude: 28.4312, longitude: -81.3081, timezone: 'America/New_York' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA', latitude: 25.7959, longitude: -80.2870, timezone: 'America/New_York' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'USA', latitude: 33.4373, longitude: -112.0078, timezone: 'America/Phoenix' },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'USA', latitude: 29.9902, longitude: -95.3368, timezone: 'America/Chicago' },
  { code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'USA', latitude: 42.3656, longitude: -71.0096, timezone: 'America/New_York' },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', country: 'USA', latitude: 44.8848, longitude: -93.2223, timezone: 'America/Chicago' },
  { code: 'DTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country: 'USA', latitude: 42.2162, longitude: -83.3554, timezone: 'America/Detroit' },
  { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'USA', latitude: 39.8729, longitude: -75.2437, timezone: 'America/New_York' },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'USA', latitude: 40.7769, longitude: -73.8740, timezone: 'America/New_York' },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'USA', latitude: 40.6895, longitude: -74.1745, timezone: 'America/New_York' },
  { code: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'USA', latitude: 40.7899, longitude: -111.9791, timezone: 'America/Denver' },
  { code: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington', country: 'USA', latitude: 38.8512, longitude: -77.0402, timezone: 'America/New_York' },
  { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington', country: 'USA', latitude: 38.9531, longitude: -77.4565, timezone: 'America/New_York' },
  { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'USA', latitude: 32.7338, longitude: -117.1933, timezone: 'America/Los_Angeles' },
  { code: 'TPA', name: 'Tampa International Airport', city: 'Tampa', country: 'USA', latitude: 27.9756, longitude: -82.5333, timezone: 'America/New_York' },
  { code: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'USA', latitude: 45.5898, longitude: -122.5951, timezone: 'America/Los_Angeles' },
  // International destinations
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK', latitude: 51.4700, longitude: -0.4543, timezone: 'Europe/London' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', latitude: 49.0097, longitude: 2.5479, timezone: 'Europe/Paris' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', latitude: 50.0379, longitude: 8.5622, timezone: 'Europe/Berlin' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', latitude: 52.3105, longitude: 4.7683, timezone: 'Europe/Amsterdam' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', latitude: 35.7720, longitude: 140.3929, timezone: 'Asia/Tokyo' },
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', latitude: 35.5494, longitude: 139.7798, timezone: 'Asia/Tokyo' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', latitude: 37.4602, longitude: 126.4407, timezone: 'Asia/Seoul' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', latitude: 1.3644, longitude: 103.9915, timezone: 'Asia/Singapore' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', latitude: 22.3080, longitude: 113.9185, timezone: 'Asia/Hong_Kong' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', latitude: -33.9399, longitude: 151.1753, timezone: 'Australia/Sydney' },
  { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', latitude: 19.4363, longitude: -99.0721, timezone: 'America/Mexico_City' },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', latitude: 21.0365, longitude: -86.8771, timezone: 'America/Cancun' },
  { code: 'GRU', name: 'São Paulo–Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', latitude: -23.4356, longitude: -46.4731, timezone: 'America/Sao_Paulo' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', latitude: 25.2532, longitude: 55.3657, timezone: 'Asia/Dubai' },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', latitude: 41.8003, longitude: 12.2389, timezone: 'Europe/Rome' },
  { code: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain', latitude: 41.2974, longitude: 2.0833, timezone: 'Europe/Madrid' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', latitude: 40.4983, longitude: -3.5676, timezone: 'Europe/Madrid' },
]

async function main() {
  console.log('🌱 Seeding database...')

  console.log('✈️  Seeding airports...')
  
  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { code: airport.code },
      update: airport,
      create: airport,
    })
  }

  console.log(`✅ Seeded ${airports.length} airports`)
  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
