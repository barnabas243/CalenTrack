import {Section, Todo} from '@/powersync/AppSchema';

export interface AddTodoModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  onBackdropPress: () => void;
  onSubmitEditing: (newTodo: Todo, selectedSection: string) => void;
  sections: Section[];
  propSelectedSection?: Section | undefined;
  propSelectedStartDate?: Date | undefined;
  propSelectedDueDate?: Date | undefined;
  propParentId?: string | null;
}

export type HighlightedElementType =
  | string
  | React.ReactElement<React.ReactElement<Text>, string | React.JSXElementConstructor<any>>
  | null;
