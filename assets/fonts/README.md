# Kraken Motorsports - Custom Fonts

This folder contains custom font files for the website.

## Currently Using Web Fonts

The website currently uses Google Fonts:
- **Bebas Neue** - Display font for headings
- **Rajdhani** - Body text and UI elements

Loaded via Google Fonts CDN in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
```

## Adding Custom Fonts (Optional)

If you want to host fonts locally for better performance or custom typography:

### 1. Download Font Files
- Get WOFF2 format (best compression)
- Include fallback formats (WOFF, TTF)

### 2. Add Font Files Here
```
fonts/
├── BebasNeue-Regular.woff2
├── BebasNeue-Regular.woff
├── Rajdhani-Regular.woff2
├── Rajdhani-SemiBold.woff2
└── Rajdhani-Bold.woff2
```

### 3. Update CSS
In `styles.css`, replace Google Fonts import with:

```css
@font-face {
    font-family: 'Bebas Neue';
    src: url('../fonts/BebasNeue-Regular.woff2') format('woff2'),
         url('../fonts/BebasNeue-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Rajdhani';
    src: url('../fonts/Rajdhani-Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}

@font-face {
    font-family: 'Rajdhani';
    src: url('../fonts/Rajdhani-SemiBold.woff2') format('woff2');
    font-weight: 600;
    font-display: swap;
}

@font-face {
    font-family: 'Rajdhani';
    src: url('../fonts/Rajdhani-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
}
```

## Custom Font Recommendations

For a more unique Kraken identity, consider:

### Racing-Style Fonts
- **Eurostile** - Classic racing typography
- **Bank Gothic** - Bold, geometric, aggressive
- **Akira Expanded** - Futuristic, wide letterforms

### Modern Display Fonts
- **Druk** - Bold condensed sans
- **Monument Extended** - Wide, geometric
- **Formula** - Racing-inspired design

## Performance Tips

- Use WOFF2 format (smaller file size)
- Subset fonts (include only needed characters)
- Use `font-display: swap` for better load performance
- Preload critical fonts in HTML head

## License Considerations

- Google Fonts are free for commercial use
- Custom fonts may require licensing
- Check font licenses before self-hosting
- Keep license files in this directory

## Current Font Stack

```css
--font-display: 'Bebas Neue', 'Impact', 'Arial Black', sans-serif;
--font-body: 'Rajdhani', 'Helvetica Neue', Arial, sans-serif;
```

Fallback fonts ensure the site remains readable if custom fonts fail to load.
