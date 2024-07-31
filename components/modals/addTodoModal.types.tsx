import {SectionItem, TodoItem} from '@/contexts/TodoContext.types';
import {User} from '@supabase/supabase-js';

export interface AddTodoModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onBackdropPress: () => void;
  onSubmitEditing: (newTodo: TodoItem, selectedSection: string) => void;
  sections: SectionItem[];
  userId: User['id'];
}

export type HighlightedElementType =
  | string
  | React.ReactElement<React.ReactElement<Text>, string | React.JSXElementConstructor<any>>
  | null;
