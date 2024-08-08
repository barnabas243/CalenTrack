import React, {forwardRef, useMemo, useCallback, useEffect} from 'react';
import {BottomSheetBackdrop, BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {BackHandler, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';
import {BottomSheetModalMethods} from '@gorhom/bottom-sheet/lib/typescript/types';
import {TodoItem} from '@/store/todo/types';
import {BottomSheetDefaultBackdropProps} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

export interface EditTodoModalProps {
  children: (data: TodoItem) => React.ReactNode;
  onDismiss: () => void;
}

let count = 0;

const EditTodoModal = forwardRef<BottomSheetModalMethods, EditTodoModalProps>(
  ({children, ...props}, ref) => {
    console.log('EditTodoModal rendered ', ++count);
    const {colors} = useTheme();

    const snapPoints = useMemo(() => ['90%'], []);

    const handleBackPress = useCallback(() => {
      if (ref) {
        ref.current?.dismiss();
        return true; // Prevent default back action (exit app)
      }
      return false; // Allow default back action (exit app)
    }, [ref]);

    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }, [handleBackPress]);

    const backdropComponent = useCallback(
      (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          opacity={0.5}
          enableTouchThrough={false}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          style={[{backgroundColor: 'rgba(0, 0, 0, 1)'}, StyleSheet.absoluteFillObject]}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        backdropComponent={backdropComponent}
        enableContentPanningGesture={false}
        ref={ref}
        {...props}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{backgroundColor: colors.background}}
        handleIndicatorStyle={{backgroundColor: colors.onSurface}}
        onDismiss={props.onDismiss}
        stackBehavior="replace">
        {(data: TodoItem) => (
          <BottomSheetView style={styles.contentContainer}>
            {typeof children === 'function' ? children(data) : children}
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

EditTodoModal.displayName = 'EditTodoModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'flex-start',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export default EditTodoModal;
