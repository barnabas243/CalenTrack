import {SectionItem, TodoItem} from '@/contexts/TodoContext.types';
import {User} from '@supabase/supabase-js';

export interface AddTodoModalProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  onSubmitEditing: (newTodo: TodoItem) => void;
  sections: SectionItem[];
  userId: User['id'];
}

export type HighlightedElementType =
  | string
  | React.ReactElement<React.ReactElement<Text>, string | React.JSXElementConstructor<any>>
  | null;
