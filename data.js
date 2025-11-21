// data.js

// Example in-memory "database" of businesses.
// In a real app, this would be queried by city/state/zip or bbox from a real DB.

// Catholic parishes database
const parishes = [
  {
    id: 1,
    name: "Cathedral of the Immaculate Conception",
    address: "307 E Central Ave, Wichita, KS 67202",
    phone: "(316) 263-6311",
    city: "Wichita",
    state: "KS",
    lat: 37.6885,
    lng: -97.3340
  },
  {
    id: 2,
    name: "St. Thomas Aquinas Catholic Church",
    address: "1321 E 62nd St N, Wichita, KS 67219",
    phone: "(316) 744-2121",
    city: "Wichita",
    state: "KS",
    lat: 37.7520,
    lng: -97.3150
  },
  {
    id: 3,
    name: "St. Francis of Assisi Catholic Church",
    address: "861 N Socora St, Wichita, KS 67212",
    phone: "(316) 722-4404",
    city: "Wichita",
    state: "KS",
    lat: 37.6950,
    lng: -97.2850
  },
  {
    id: 4,
    name: "St. Anne Catholic Church",
    address: "8021 W 13th St N, Wichita, KS 67212",
    phone: "(316) 722-2029",
    city: "Wichita",
    state: "KS",
    lat: 37.7150,
    lng: -97.4450
  },
  {
    id: 5,
    name: "St. Elizabeth Ann Seton Catholic Church",
    address: "10828 E 13th St N, Wichita, KS 67206",
    phone: "(316) 634-3694",
    city: "Wichita",
    state: "KS",
    lat: 37.7180,
    lng: -97.2350
  },
  {
    id: 6,
    name: "Our Lady of Perpetual Help Catholic Church",
    address: "3333 E 3rd St N, Wichita, KS 67208",
    phone: "(316) 683-5313",
    city: "Wichita",
    state: "KS",
    lat: 37.7020,
    lng: -97.2750
  },
  {
    id: 7,
    name: "St. Jude Catholic Church",
    address: "1904 S 9th St, Wichita, KS 67213",
    phone: "(316) 263-1523",
    city: "Wichita",
    state: "KS",
    lat: 37.6580,
    lng: -97.3500
  },
  {
    id: 8,
    name: "Church of the Magdalen",
    address: "4545 E Harry St, Wichita, KS 67218",
    phone: "(316) 685-4203",
    city: "Wichita",
    state: "KS",
    lat: 37.6750,
    lng: -97.2650
  }
];

const businesses = [
  {
    id: 1,
    name: "Downtown Coffee",
    address: "123 Main St, Wichita, KS 67202",
    website: "https://example-coffee.com",
    email: "info@example-coffee.com",
    owner: "Jane Doe",
    phone: "(316) 555-1234",
    category: "Cafe",
    description: "Cozy coffee shop with free Wi-Fi and pastries.",
    lat: 37.6860,
    lng: -97.3356,
    imageUrl: null,
    tags: "coffee, cafe, pastries, breakfast, lunch, wifi, meeting space, local roaster",
    parishId: 1,
    verified: true
  },
  {
    id: 2,
    name: "Riverfront Books",
    address: "456 River St, Wichita, KS 67202",
    website: "https://riverfrontbooks.example.com",
    email: "hello@riverfrontbooks.example.com",
    owner: "John Smith",
    phone: "(316) 555-5678",
    category: "Bookstore",
    description: "Independent bookstore focusing on local authors.",
    lat: 37.688,
    lng: -97.338,
    imageUrl: null, // you can add this file if you want
    tags: "books, bookstore, independent, local authors, gifts, reading, literature",
    verified: true
  },
  {
    id: 3,
    name: "City Cycle Repair",
    address: "789 Bike Ln, Wichita, KS 67202",
    website: "https://citycycle.example.com",
    email: "support@citycycle.example.com",
    owner: "Alex Johnson",
    phone: "(316) 555-9012",
    category: "Bike Shop",
    description: "Full service bike repair and sales.",
    lat: 37.684,
    lng: -97.333,
    imageUrl: null,
    tags: "bike, bicycle, repair, maintenance, cycling, sports, outdoors, fitness",
    verified: false
  },
  {
    id: 4,
    name: "Sacred Heart Bakery",
    address: "234 Douglas Ave, Wichita, KS 67202",
    website: "https://sacredheart-bakery.com",
    email: "orders@sacredheart-bakery.com",
    owner: "Maria Rodriguez",
    phone: "(316) 555-2345",
    category: "Bakery",
    description: "Traditional European bakery with fresh bread daily.",
    lat: 37.6890,
    lng: -97.3400,
    imageUrl: null,
    tags: "bakery, bread, pastries, desserts, breakfast, custom cakes, gluten-free",
    parishId: 1,
    verified: true
  },
  {
    id: 5,
    name: "Divine Pizza Kitchen",
    address: "567 E Douglas, Wichita, KS 67202",
    website: "https://divinepizza.com",
    email: "info@divinepizza.com",
    owner: "Tony Marino",
    phone: "(316) 555-3456",
    category: "Restaurant",
    description: "Family-owned pizzeria serving authentic Italian pizza.",
    lat: 37.6870,
    lng: -97.3300,
    imageUrl: null,
    tags: "pizza, restaurant, italian, lunch, dinner, family-friendly, takeout, delivery",
    verified: true
  },
  {
    id: 6,
    name: "Grace Dental Care",
    address: "890 N Broadway, Wichita, KS 67214",
    website: "https://gracedental.com",
    email: "appointments@gracedental.com",
    owner: "Dr. Sarah Chen",
    phone: "(316) 555-4567",
    category: "Healthcare",
    description: "Comprehensive dental care for the whole family.",
    lat: 37.6950,
    lng: -97.3380,
    imageUrl: null,
    tags: "dental, healthcare, family dentistry, cosmetic dentistry, emergency care",
    verified: true
  },
  {
    id: 7,
    name: "Blessed Hands Salon",
    address: "345 W Douglas Ave, Wichita, KS 67213",
    website: "https://blessedhandssalon.com",
    email: "book@blessedhandssalon.com",
    owner: "Jessica Williams",
    phone: "(316) 555-5678",
    category: "Beauty",
    description: "Full-service hair salon and spa treatments.",
    lat: 37.6855,
    lng: -97.3450,
    imageUrl: null,
    tags: "salon, beauty, hair, spa, nails, massage, skincare, wedding services",
    parishId: 2,
    verified: true
  },
  {
    id: 8,
    name: "Faith Fitness Gym",
    address: "678 N Rock Rd, Wichita, KS 67206",
    website: "https://faithfitness.com",
    email: "membership@faithfitness.com",
    owner: "Michael Thompson",
    phone: "(316) 555-6789",
    category: "Fitness",
    description: "24/7 gym with personal training and group classes.",
    lat: 37.7100,
    lng: -97.2800,
    imageUrl: null,
    tags: "gym, fitness, personal training, yoga, cardio, weights, health, wellness",
    parishId: 5,
    verified: true
  },
  {
    id: 9,
    name: "Holy Grounds Garden Center",
    address: "901 W 21st St N, Wichita, KS 67203",
    website: "https://holygroundsgarden.com",
    email: "info@holygroundsgarden.com",
    owner: "Robert Green",
    phone: "(316) 555-7890",
    category: "Garden Center",
    description: "Plants, landscaping supplies, and garden consultation.",
    lat: 37.7200,
    lng: -97.3500,
    imageUrl: null,
    tags: "gardening, plants, landscaping, nursery, outdoor, home improvement, flowers",
    verified: true
  },
  {
    id: 10,
    name: "Trinity Auto Repair",
    address: "123 S Seneca St, Wichita, KS 67213",
    website: "https://trinityauto.com",
    email: "service@trinityauto.com",
    owner: "David Martinez",
    phone: "(316) 555-8901",
    category: "Auto Repair",
    description: "Honest and reliable auto repair and maintenance.",
    lat: 37.6800,
    lng: -97.3600,
    imageUrl: null,
    tags: "auto repair, mechanic, car service, maintenance, oil change, tires, brake repair",
    verified: true
  },
  {
    id: 11,
    name: "St. Joseph's Hardware",
    address: "456 E Harry St, Wichita, KS 67211",
    website: "https://stjosephshardware.com",
    email: "help@stjosephshardware.com",
    owner: "Thomas Baker",
    phone: "(316) 555-9012",
    category: "Hardware Store",
    description: "Your neighborhood hardware store since 1985.",
    lat: 37.6700,
    lng: -97.3250,
    imageUrl: null,
    tags: "hardware, tools, home improvement, diy, plumbing, electrical, paint",
    verified: true
  },
  {
    id: 12,
    name: "Angels Pet Grooming",
    address: "789 N West St, Wichita, KS 67203",
    website: "https://angelspetgrooming.com",
    email: "bookings@angelspetgrooming.com",
    owner: "Emily Parker",
    phone: "(316) 555-0123",
    category: "Pet Services",
    description: "Professional pet grooming with loving care.",
    lat: 37.7150,
    lng: -97.3550,
    imageUrl: null,
    tags: "pet grooming, pets, dogs, cats, animal care, bathing, nail trimming",
    verified: true
  },
  {
    id: 13,
    name: "Covenant Law Firm",
    address: "234 N Market St, Wichita, KS 67202",
    website: "https://covenantlawfirm.com",
    email: "contact@covenantlawfirm.com",
    owner: "Attorney James Wilson",
    phone: "(316) 555-1234",
    category: "Legal Services",
    description: "Experienced attorneys serving families and businesses.",
    lat: 37.6920,
    lng: -97.3370,
    imageUrl: null,
    tags: "legal, attorney, lawyer, family law, business law, estate planning",
    verified: true
  },
  {
    id: 14,
    name: "Heavenly Scent Florist",
    address: "567 S Hillside St, Wichita, KS 67211",
    website: "https://heavenlyscentflorist.com",
    email: "orders@heavenlyscentflorist.com",
    owner: "Laura Anderson",
    phone: "(316) 555-2345",
    category: "Florist",
    description: "Beautiful arrangements for all occasions.",
    lat: 37.6750,
    lng: -97.2900,
    imageUrl: null,
    tags: "florist, flowers, wedding, funeral, gifts, arrangements, delivery",
    verified: true
  },
  {
    id: 15,
    name: "Cornerstone Accounting",
    address: "890 E Central Ave, Wichita, KS 67214",
    website: "https://cornerstoneaccounting.com",
    email: "info@cornerstoneaccounting.com",
    owner: "Richard Davis",
    phone: "(316) 555-3456",
    category: "Accounting",
    description: "Tax preparation and financial planning services.",
    lat: 37.7000,
    lng: -97.3200,
    imageUrl: null,
    tags: "accounting, tax preparation, bookkeeping, financial planning, business services",
    verified: true
  },
  {
    id: 16,
    name: "Blessed Thrift Store",
    address: "345 S Broadway, Wichita, KS 67202",
    website: "https://blessedthrift.com",
    email: "donations@blessedthrift.com",
    owner: "Mary Johnson",
    phone: "(316) 555-4567",
    category: "Thrift Store",
    description: "Quality secondhand items supporting local charities.",
    lat: 37.6820,
    lng: -97.3390,
    imageUrl: null,
    tags: "thrift store, secondhand, clothing, furniture, donations, charity, shopping",
    verified: true
  },
  {
    id: 17,
    name: "Redemption CrossFit",
    address: "678 N Tyler Rd, Wichita, KS 67212",
    website: "https://redemptioncrossfit.com",
    email: "join@redemptioncrossfit.com",
    owner: "Coach Jake Miller",
    phone: "(316) 555-5678",
    category: "Fitness",
    description: "High-intensity CrossFit training and community.",
    lat: 37.7050,
    lng: -97.2700,
    imageUrl: null,
    tags: "crossfit, fitness, gym, training, strength, cardio, community, wellness",
    verified: true
  },
  {
    id: 18,
    name: "Providence Insurance Agency",
    address: "901 W Maple St, Wichita, KS 67213",
    website: "https://providenceinsurance.com",
    email: "quotes@providenceinsurance.com",
    owner: "Steven Clark",
    phone: "(316) 555-6789",
    category: "Insurance",
    description: "Comprehensive insurance solutions for families and businesses.",
    lat: 37.6780,
    lng: -97.3520,
    imageUrl: null,
    tags: "insurance, auto insurance, home insurance, business insurance, life insurance",
    verified: true
  },
  {
    id: 19,
    name: "Little Lamb Daycare",
    address: "234 E 13th St N, Wichita, KS 67214",
    website: "https://littlelambdaycare.com",
    email: "enroll@littlelambdaycare.com",
    owner: "Patricia White",
    phone: "(316) 555-7890",
    category: "Childcare",
    description: "Nurturing childcare in a safe, loving environment.",
    lat: 37.7100,
    lng: -97.3300,
    imageUrl: null,
    tags: "daycare, childcare, preschool, education, children, family-friendly",
    parishId: 2,
    verified: true
  },
  {
    id: 20,
    name: "Faithful Companion Veterinary",
    address: "567 N Woodlawn Blvd, Wichita, KS 67208",
    website: "https://faithfulcompanionvet.com",
    email: "appointments@faithfulcompanionvet.com",
    owner: "Dr. Jennifer Lee",
    phone: "(316) 555-8901",
    category: "Veterinary",
    description: "Compassionate care for your furry family members.",
    lat: 37.7000,
    lng: -97.2600,
    imageUrl: null,
    tags: "veterinary, vet, animal care, pets, dogs, cats, emergency care, surgery",
    verified: true
  },
  {
    id: 21,
    name: "Grace & Grit BBQ",
    address: "890 S West St, Wichita, KS 67213",
    website: "https://gracegritbbq.com",
    email: "catering@gracegritbbq.com",
    owner: "Marcus Brown",
    phone: "(316) 555-9012",
    category: "Restaurant",
    description: "Authentic Kansas BBQ with a family recipe.",
    lat: 37.6650,
    lng: -97.3580,
    imageUrl: null,
    tags: "bbq, restaurant, barbecue, lunch, dinner, catering, takeout, meat",
    verified: true
  },
  {
    id: 22,
    name: "Kingdom Kids Tutoring",
    address: "345 E Pawnee Ave, Wichita, KS 67211",
    website: "https://kingdomkidstutoring.com",
    email: "info@kingdomkidstutoring.com",
    owner: "Rebecca Martinez",
    phone: "(316) 555-0123",
    category: "Education",
    description: "Personalized tutoring for K-12 students.",
    lat: 37.6600,
    lng: -97.3150,
    imageUrl: null,
    tags: "tutoring, education, learning, children, academics, homework help, test prep",
    verified: true
  },
  {
    id: 23,
    name: "Sacred Grounds Landscaping",
    address: "678 N Ridge Rd, Wichita, KS 67212",
    website: "https://sacredgroundslandscaping.com",
    email: "contact@sacredgroundslandscaping.com",
    owner: "Daniel Green",
    phone: "(316) 555-1234",
    category: "Landscaping",
    description: "Professional landscaping and lawn care services.",
    lat: 37.7180,
    lng: -97.2750,
    imageUrl: null,
    tags: "landscaping, lawn care, gardening, outdoor, maintenance, design, irrigation",
    verified: true
  }
];

// Example "filter" by bounding box (very naive)
function getBusinessesInBbox(minLat, minLng, maxLat, maxLng) {
  return businesses.filter(b => {
    return (
      b.lat >= minLat &&
      b.lat <= maxLat &&
      b.lng >= minLng &&
      b.lng <= maxLng
    );
  });
}

function getParishesInBbox(minLat, minLng, maxLat, maxLng) {
  return parishes.filter(p => {
    return (
      p.lat >= minLat &&
      p.lat <= maxLat &&
      p.lng >= minLng &&
      p.lng <= maxLng
    );
  });
}

function getParishesByCity(city) {
  return parishes.filter(p => 
    p.city.toLowerCase() === city.toLowerCase()
  );
}

function getParishById(id) {
  return parishes.find(p => p.id === id);
}

module.exports = {
  getBusinessesInBbox,
  getParishesInBbox,
  getParishesByCity,
  getParishById,
  businesses,
  parishes
};

