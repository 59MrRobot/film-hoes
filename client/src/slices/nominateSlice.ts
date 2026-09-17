import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface NominateState {
  searchQuery: string;
  searchResults: any[];
  showAll: boolean;
}

const initialState: NominateState = {
  searchQuery: '',
  searchResults: [],
  showAll: false,
};

const nominateSlice = createSlice({
  name: 'nominate',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    setShowAll: (state, action: PayloadAction<boolean>) => {
      state.showAll = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.showAll = false;
    }
  },
});

export const { setSearchQuery, setSearchResults, setShowAll, clearSearch } = nominateSlice.actions;
export default nominateSlice.reducer;
