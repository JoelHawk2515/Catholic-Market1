// geocode-all-businesses.js
// This script geocodes all businesses that don't have lat/lng coordinates

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const Business = require('./models/Business');

// Helper function to sleep between API calls (avoid rate limiting)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geocode using Photon (Komoot's geocoding service)
async function geocodeWithPhoton(address) {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.append("q", address);
    url.searchParams.append("limit", "1");
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Photon geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates; // [lng, lat] format
      
      return {
        lat: coords[1],
        lng: coords[0],
        street: props.street || props.name || null,
        city: props.city || null,
        state: props.state || null,
        zip: props.postcode || null,
        displayName: props.name || address
      };
    }
  } catch (err) {
    console.error('Photon error:', err.message);
  }
  
  return null;
}

// Geocode using Nominatim (OpenStreetMap)
async function geocodeWithNominatim(address) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.append("q", address);
    url.searchParams.append("format", "json");
    url.searchParams.append("limit", "1");
    url.searchParams.append("addressdetails", "1");
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CatholicMarketDirectory/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const addr = result.address || {};
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        street: addr.road || addr.street || null,
        city: addr.city || addr.town || addr.village || null,
        state: addr.state || null,
        zip: addr.postcode || null,
        displayName: result.display_name
      };
    }
  } catch (err) {
    console.error('Nominatim error:', err.message);
  }
  
  return null;
}

async function geocodeAddress(address) {
  // Try Photon first
  try {
    const photonResult = await geocodeWithPhoton(address);
    if (photonResult) {
      return photonResult;
    }
  } catch (err) {
    console.error('Photon failed:', err.message);
  }
  
  // Fallback to Nominatim
  await sleep(1000); // Wait 1 second before Nominatim (rate limit)
  
  try {
    const nominatimResult = await geocodeWithNominatim(address);
    if (nominatimResult) {
      return nominatimResult;
    }
  } catch (err) {
    console.error('Nominatim failed:', err.message);
  }
  
  return null;
}

async function geocodeAllBusinesses() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Find all businesses without coordinates
    const businessesWithoutCoords = await Business.find({
      $or: [
        { lat: null },
        { lat: { $exists: false } },
        { lng: null },
        { lng: { $exists: false } }
      ]
    });

    console.log(`Found ${businessesWithoutCoords.length} businesses without coordinates\n`);

    let successCount = 0;
    let failCount = 0;

    for (const business of businessesWithoutCoords) {
      console.log(`\nGeocoding: ${business.name}`);
      console.log(`  Address: ${business.address}`);

      try {
        // Build full address
        let fullAddress = business.address;
        if (business.city || business.state || business.zip) {
          const parts = [business.address];
          if (business.city) parts.push(business.city);
          if (business.state) parts.push(business.state);
          if (business.zip) parts.push(business.zip);
          fullAddress = parts.join(', ');
        }

        const coords = await geocodeAddress(fullAddress);

        if (coords) {
          business.lat = coords.lat;
          business.lng = coords.lng;
          business.street = coords.street || business.street;
          business.city = coords.city || business.city;
          business.state = coords.state || business.state;
          business.zip = coords.zip || business.zip;
          
          await business.save();
          
          console.log(`  ✓ Success: ${coords.lat}, ${coords.lng}`);
          console.log(`  Location: ${coords.displayName}`);
          successCount++;
        } else {
          console.log(`  ✗ Failed: Could not geocode`);
          failCount++;
        }

        // Wait 2 seconds between each geocode to avoid rate limiting
        await sleep(2000);

      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        failCount++;
      }
    }

    console.log('\n=== Geocoding Summary ===');
    console.log(`Total businesses processed: ${businessesWithoutCoords.length}`);
    console.log(`Successfully geocoded: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    console.log('Geocoding complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

geocodeAllBusinesses();
