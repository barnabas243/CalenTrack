import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {Section, SECTION_TABLE} from '@/powersync/AppSchema';

/**
 * Define the initial state for the section slice.
 */
export interface SectionState {
  sections: Section[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial state for the section slice.
 * Includes a default inbox section.
 */
export const initialState: SectionState = {
  sections: [
    {id: '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d', name: 'Inbox', user_id: '', created_at: null},
  ],
  loading: false,
  error: null,
};

/**
 * Thunk to fetch sections for a given user ID from the database.
 * @param userId - The ID of the user whose sections are to be fetched.
 * @param db - The database instance to use for the query.
 * @returns A promise that resolves to an array of sections.
 */
export const fetchSections = createAsyncThunk<
  Section[],
  {userId: string; db: any},
  {rejectValue: string}
>('sections/fetchSections', async ({userId, db}, {rejectWithValue}) => {
  try {
    const sections = await db.selectFrom(SECTION_TABLE).selectAll().execute();
    return sections as Section[];
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch sections');
  }
});

/**
 * Thunk to insert a new section into the database.
 * @param newSection - The section object to be inserted.
 * @param db - The database instance to use for the insertion.
 * @returns A promise that resolves to the inserted section.
 */
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

/**
 * Thunk to update the name of a section in the database.
 * @param updatedSection - The section object with the updated name.
 * @param db - The database instance to use for the update.
 * @returns A promise that resolves to the updated section.
 */
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

/**
 * Thunk to delete a section by its ID from the database.
 * @param id - The ID of the section to be deleted.
 * @param db - The database instance to use for the deletion.
 * @returns A promise that resolves to the ID of the deleted section.
 */
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

/**
 * Create the section slice using Redux Toolkit.
 */
const sectionSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    /**
     * Reducer to add a new section to the state.
     * @param state - The current state.
     * @param action - The action containing the new section.
     */
    addSection: (state, action) => {
      state.sections.push(action.payload);
    },
    /**
     * Reducer to update an existing section in the state.
     * @param state - The current state.
     * @param action - The action containing the updated section.
     */
    updateSection: (state, action) => {
      const index = state.sections.findIndex(section => section.id === action.payload.id);
      if (index !== -1) state.sections[index] = action.payload;
    },
    /**
     * Reducer to delete a section from the state.
     * @param state - The current state.
     * @param action - The action containing the ID of the section to be deleted.
     */
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
        const newSections = action.payload.filter(
          fetchedSection =>
            !state.sections.some(existingSection => existingSection.id === fetchedSection.id),
        );
        state.sections = [...state.sections, ...newSections];
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

/**
 * Export the actions generated by the slice.
 */
export const {addSection, updateSection, deleteSection} = sectionSlice.actions;

/**
 * Export the reducer for the section slice.
 */
export default sectionSlice.reducer;
