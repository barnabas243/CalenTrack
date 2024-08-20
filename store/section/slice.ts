import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {Section, SECTION_TABLE} from '@/powersync/AppSchema';

// Define the initial state
export interface SectionState {
  sections: Section[];
  loading: boolean;
  error: string | null;
}

export const initialState: SectionState = {
  sections: [
    {id: '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d', name: 'Inbox', user_id: '', created_at: null},
  ],
  loading: false,
  error: null,
};

// Thunk to fetch sections
export const fetchSections = createAsyncThunk<
  Section[],
  {userId: string; db: any},
  {rejectValue: string}
>('sections/fetchSections', async ({userId, db}, {rejectWithValue}) => {
  // Use the db instance to fetch sections

  try {
    const sections = await db.selectFrom(SECTION_TABLE).selectAll().execute();

    return sections as Section[];
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch sections');
  }
});

// Thunk to insert a new section
export const insertSection = createAsyncThunk<
  Section,
  {newSection: Section; db: any},
  {rejectValue: string}
>('sections/insertSection', async ({newSection, db}, {rejectWithValue}) => {
  try {
    const insertResult = await db
      .insertInto(SECTION_TABLE)
      .values(newSection)
      .returningAll()
      .executeTakeFirstOrThrow();
    return insertResult as Section;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to insert section');
  }
});

// Thunk to update a section by ID with a new name
export const updateSectionName = createAsyncThunk<
  Section,
  {updatedSection: Section; db: any},
  {rejectValue: string}
>('sections/updateSectionName', async ({updatedSection, db}, {rejectWithValue}) => {
  const {id, name} = updatedSection;
  try {
    const updateResult = await db
      .updateTable(SECTION_TABLE)
      .set({name})
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return updateResult as Section;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update section');
  }
});

// Thunk to delete a section
export const deleteSectionById = createAsyncThunk<
  string,
  {id: string; db: any},
  {rejectValue: string}
>('sections/deleteSectionById', async ({id, db}, {rejectWithValue}) => {
  try {
    await db.deleteFrom(SECTION_TABLE).where('id', '=', id).execute();
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete section');
  }
});

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

        // Filter out any sections from the fetched payload that already exist in the state
        const newSections = action.payload.filter(
          fetchedSection =>
            !state.sections.some(existingSection => existingSection.id === fetchedSection.id),
        );

        // Append only the new sections to the existing state
        state.sections = [
          ...state.sections, // Keep the permanent initial inbox section
          ...newSections, // Add only the new sections
        ];
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
