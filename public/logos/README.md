# Program Logos

Place your program logo images in this folder.

## Naming Convention

Use the program ID from `src/data/programs.js` as the filename:
- `california-huskies.png`
- `south-central-prep.png`
- `fort-international.png`
- etc.

## Recommended Specifications

- **Format**: PNG with transparent background (preferred) or JPG
- **Size**: 50x50px to 100x100px
- **Aspect Ratio**: Square (1:1) works best

## How to Add a New Program

1. Add your logo image to this folder
2. Open `src/data/programs.js`
3. Add a new entry to the `programs` array:

```javascript
{
  id: 'your-program-id',
  name: 'Your Program Name',
  city: 'City Name',
  state: 'ST',
  region: 'East', // East, West, Midwest, or South
  logo: '/logos/your-program-id.png',
  coordinates: [latitude, longitude], // Use Google Maps to find these
  website: 'https://your-website.com' // Optional
}
```

4. Save and refresh the page to see your new program on the map!
