import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {supabase} from '@/utils/supabase';
import {SectionItem} from './types';

// Define the initial state
export interface SectionState {
  sections: SectionItem[];
  loading: boolean;
  error: string | null;
}

export const initialState: SectionState = {
  sections: [],
  loading: false,
  error: null,
};

// Thunk to fetch sections
export const fetchSections = createAsyncThunk('sections/fetchSections', async (userId: string) => {
  const {data, error} = await supabase
    .from('sections')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('id', {ascending: true});
  if (error) throw error;
  return data as SectionItem[];
});

// Thunk to insert a new section
export const insertSection = createAsyncThunk(
  'sections/insertSection',
  async (newSection: {name: string; user_id: string}) => {
    const {data, error} = await supabase
      .from('sections')
      .insert({name: newSection.name, user_id: newSection.user_id})
      .select();
    if (error) throw error;
    return data[0] as SectionItem;
  },
);

// Thunk to update a section by ID with a new name
export const updateSectionName = createAsyncThunk(
  'sections/updateSectionName',
  async (updatedSection: SectionItem) => {
    const {id, name} = updatedSection;
    const {data, error} = await supabase.from('sections').update({name}).eq('id', id).select();
    if (error) throw error;
    return data[0] as SectionItem;
  },
);

// Thunk to delete a section
export const deleteSectionById = createAsyncThunk(
  'sections/deleteSectionById',
  async (id: number) => {
    const {error} = await supabase.from('sections').delete().eq('id', id);
    if (error) throw error;
    return id; // Return the deleted ID
  },
);

const sectionSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    // The reducers are no longer used for API calls
    // Keeping them for possible local updates or other logic
    addSection: (state, action) => {
      state.sections.push(action.payload);
    },
    updateSection: (state, action) => {
      const index = state.sections.findIndex(section => section.id === action.payload.id);
      if (index !== -1) state.sections[index] = action.payload;
    },
    deleteSection: (state, action) => {
      state.sections = state.sections.filter(section => section.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSections.pending, state => {
        state.loading = true;
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = action.payload;
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sections';
      })
      .addCase(insertSection.pending, state => {
        state.loading = true;
      })
      .addCase(insertSection.fulfilled, (state, action) => {
        state.loading = false;
        state.sections.push(action.payload);
      })
      .addCase(insertSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to insert section';
      })
      .addCase(updateSectionName.pending, state => {
        state.loading = true;
      })
      .addCase(updateSectionName.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sections.findIndex(section => section.id === action.payload.id);
        if (index !== -1) state.sections[index] = action.payload;
      })
      .addCase(updateSectionName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update section';
      })
      .addCase(deleteSectionById.pending, state => {
        state.loading = true;
      })
      .addCase(deleteSectionById.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = state.sections.filter(section => section.id !== action.payload);
      })
      .addCase(deleteSectionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete section';
      });
  },
});

export const {addSection, updateSection, deleteSection} = sectionSlice.actions;
export default sectionSlice.reducer;
