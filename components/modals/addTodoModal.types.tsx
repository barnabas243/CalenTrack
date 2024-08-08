import {SectionItem} from '@/store/section/types';
import {TodoItem} from '@/store/todo/types';

export interface AddTodoModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onBackdropPress: () => void;
  onSubmitEditing: (newTodo: TodoItem, selectedSection: string) => void;
  sections: SectionItem[];
  propSelectedSectionName?: string;
  propSelectedDueDate?: Date | undefined;
}

export type HighlightedElementType =
  | string
  | React.ReactElement<React.ReactElement<Text>, string | React.JSXElementConstructor<any>>
  | null;
