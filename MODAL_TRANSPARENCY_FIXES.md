# Modal Backdrop Transparency Fixes

## Summary
Fixed modal backdrop transparency across the entire application to provide a consistent, gentle 30% transparency instead of the previously inconsistent darker backgrounds.

## Changes Made

### 1. Add Analyst Modal (`src/components/add-analyst-modal.tsx`)
- **Before**: `bg-black bg-opacity-50` (50% opacity - too dark)
- **After**: `bg-black bg-opacity-30` (30% opacity - gentle transparency)
- **Line**: 439

### 2. Testimonials Modal (`src/app/testimonials/page.tsx`)
- **Before**: `bg-black bg-opacity-50` (50% opacity - too dark)
- **After**: `bg-black bg-opacity-30` (30% opacity - gentle transparency)
- **Line**: 199

### 3. Analyst Drawer Engagement Modal (`src/components/analyst-drawer.tsx`)
- **Before**: `bg-black bg-opacity-50` (50% opacity - too dark)
- **After**: `bg-black bg-opacity-30` (30% opacity - gentle transparency)
- **Line**: 861

### 4. Analyst Actions Menu Modal
- This component already had a good custom backdrop: `rgba(15, 23, 42, 0.15)`
- No changes needed - already properly implemented

### 5. Analyst Drawer Main Backdrop
- This component already used proper 30% opacity: `rgba(0, 0, 0, 0.3)`
- No changes needed - already properly implemented

## Design Consistency
All modals now use a consistent 30% black overlay that:
- ✅ Provides gentle transparency allowing background content to remain visible
- ✅ Maintains sufficient contrast for accessibility
- ✅ Creates a consistent user experience across all modals
- ✅ Avoids the jarring "pitch black" backdrop effect

## Files Modified
1. `src/components/add-analyst-modal.tsx`
2. `src/app/testimonials/page.tsx`
3. `src/components/analyst-drawer.tsx`

## Testing
All modals should now display with a gentle 30% transparency backdrop that allows users to see the underlying interface while maintaining focus on the modal content.
