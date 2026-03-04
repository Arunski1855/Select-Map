# ADI SEL3CT Backdrop Textures

This folder contains the magenta blur backdrop textures used for brand-led moments in the ADI SEL3CT application.

## Required Files

Place the following backdrop image files in this directory:

| Filename | Description | Use Case |
|----------|-------------|----------|
| `backdrop-one.jpg` | Dramatic magenta waves/streaks on black. High saturation with visible light trails. | Splash screens, launch moments, hero banners, high-impact marketing |
| `backdrop-two.jpg` | Diffused magenta glow with smoky gradients. Softer edges, more atmospheric. | Modal backgrounds, section dividers, content overlays, dialog backdrops |
| `backdrop-three.jpg` | Very dark with minimal magenta accent. Understated, nearly black with hint of glow. | App backgrounds, persistent UI elements, subtle branding |

## File Specifications

- **Format**: JPEG (optimized) or WebP
- **Resolution**: 1920x1080 minimum, 2560x1440 recommended
- **Color profile**: sRGB
- **Quality**: 80-85% JPEG quality, or use WebP for smaller files

## CSS Usage

```css
/* Base backdrop class */
.brand-backdrop {
  background-color: #000000;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Apply specific variant */
.brand-backdrop--one {
  background-image: url('/textures/backdrop-one.jpg');
}

.brand-backdrop--two {
  background-image: url('/textures/backdrop-two.jpg');
}

.brand-backdrop--three {
  background-image: url('/textures/backdrop-three.jpg');
}
```

## Brand Guidelines

See `.claude/commands/adi-select.md` for complete usage guidelines and when to use each backdrop variant.
