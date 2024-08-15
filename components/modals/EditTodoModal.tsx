import React, {forwardRef, useMemo, useCallback, useEffect} from 'react';
import {BottomSheetBackdrop, BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {BackHandler, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';
import {BottomSheetModalMethods} from '@gorhom/bottom-sheet/lib/typescript/types';

import {BottomSheetDefaultBackdropProps} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import {Todo} from '@/powersync/AppSchema';

export interface EditTodoModalProps {
  children: (data: Todo) => React.ReactNode;
  onDismiss: () => void;
}

const EditTodoModal = forwardRef<BottomSheetModalMethods, EditTodoModalProps>(
  ({children, ...props}, ref) => {
    const {colors} = useTheme();

    const snapPoints = useMemo(() => ['80%'], []);

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
        // handleIndicatorStyle={{backgroundColor: colors.onSurface}}
        onDismiss={props.onDismiss}
        stackBehavior="replace">
        {(data: Todo) => (
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
