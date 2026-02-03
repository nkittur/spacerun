# Sun Glow Gradient - iOS Dots Bug Strategy Document

## Problem
Blue and purple colored dots/speckles appear around sun glows on iPhone but NOT on Mac desktop. The dots are worse near the sun (high alpha areas).

## Confirmed Root Cause
**DynamicTexture (canvas-based) rendering on iOS mobile GPU.**

Evidence:
- Simple disc with solid color material = NO DOTS
- Any DynamicTexture approach = DOTS on iOS
- Opaque black fill in texture = no dots but blocks background
- Transparent fill = dots return

## Approaches Already Tried (All Failed)

### Texture/Material Variations
| Approach | Result |
|----------|--------|
| Increased texture resolution (256→512) | Still dots |
| Disabled mipmaps | Still dots |
| Drew circular gradient instead of square | Still dots |
| diffuseTexture + emissiveTexture + useAlphaFromDiffuseTexture | Still dots |
| emissiveTexture + opacityTexture | Still dots |
| diffuseTexture only + emissiveColor | Still dots |
| premultipliedAlpha: false on engine | Still dots |
| BILINEAR_SAMPLINGMODE | Still dots |
| CLAMP_ADDRESSMODE | Still dots |
| anisotropicFilteringLevel = 1 | Still dots |
| update(false) no invertY | Still dots |
| clearRect + transparent fillRect | Still dots |
| Solid black fillRect (blocks background) | NO DOTS but unusable |

### What Works
| Approach | Result |
|----------|--------|
| Simple disc mesh with solid color (no texture) | NO DOTS |
| Opaque black texture fill | NO DOTS (but blocks background) |

## Remaining Possible Root Causes

1. **Canvas 2D premultiplied alpha mismatch** - Canvas internally uses premultiplied alpha; WebGL may expect non-premultiplied
2. **Uninitialized texture memory** - iOS may show garbage memory that desktop hides
3. **Low precision with semi-transparent alpha values** - Mobile GPU mediump precision issues
4. **Texture filtering artifacts** - Despite settings, iOS may handle filtering differently

## Untried Solutions (Ranked by Likelihood of Success)

### HIGH PROBABILITY (Avoid DynamicTexture entirely)
1. **Multiple concentric solid-color discs** - No textures at all, simulate gradient with 5-8 nested discs of decreasing size and alpha
2. **Pre-made PNG glow texture** - Load a static image file instead of generating dynamically
3. **Vertex colors on custom mesh** - Create disc geometry with alpha baked into vertex colors

### MEDIUM PROBABILITY (Fix DynamicTexture usage)
4. **Use getImageData/putImageData** - Full pixel control, write exact RGBA values
5. **globalCompositeOperation = 'copy'** - Force exact pixel values, no blending
6. **Pre-multiply RGB values manually** - Match canvas internal format

### LOW PROBABILITY (Shader-level fixes)
7. **Custom ShaderMaterial** - Bypass StandardMaterial entirely
8. **Force highp precision** - If Babylon.js allows shader precision control

## Recommended Next Action

**Try #1: Multiple concentric solid-color discs**

Rationale:
- We KNOW solid color discs work (no dots)
- Completely avoids DynamicTexture/canvas issues
- Simple to implement
- Will look smooth with enough layers (6-8 discs)
- No texture memory issues possible

Implementation:
- Create 6-8 disc meshes at same position
- Each disc slightly smaller than previous
- Each disc has higher alpha than previous
- Creates smooth gradient effect without any textures
