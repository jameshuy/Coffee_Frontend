# Data Folder

This folder contains static data that was previously embedded in component files. Moving this data here improves code organization, maintainability, and reusability.

## Files

### `styles.ts`
Contains the poster generation styles data including:
- `StyleData` interface
- `STYLES` array with all available styles and their traits
- `FREE_STYLES` array with styles available to all users

### `feelings.ts`
Contains the emotional context data for prompt construction including:
- `FeelingData` interface  
- `FEELINGS` array with all available feelings and their visual traits

### `index.ts`
Exports all data types and constants for easy importing.

## Usage

```typescript
import { STYLES, FEELINGS, FREE_STYLES, type StyleData, type FeelingData } from '@/data';
```

## Benefits of This Structure

1. **Separation of Concerns**: Data is separated from component logic
2. **Maintainability**: Easier to update styles and feelings without touching component code
3. **Reusability**: Data can be imported by multiple components
4. **Type Safety**: TypeScript interfaces are centralized and reusable
5. **Testing**: Data can be easily mocked or tested independently
6. **Performance**: Data is loaded once and shared across components

## Previously Located In

- `client/src/pages/Create.tsx` - Styles and feelings arrays were embedded inline
- These large static arrays have been moved to dedicated data files
