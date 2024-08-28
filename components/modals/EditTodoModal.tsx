import React, {forwardRef, useMemo, useCallback, useEffect} from 'react';
import {BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {BackHandler, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';
import {BottomSheetModalMethods} from '@gorhom/bottom-sheet/lib/typescript/types';

import {BottomSheetDefaultBackdropProps} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import {Todo} from '@/powersync/AppSchema';
import {router} from 'expo-router';

export interface EditTodoModalProps {
  children: (data: Todo) => React.ReactNode;
}

const EditTodoModal = forwardRef<BottomSheetModalMethods, EditTodoModalProps>(
  ({children, ...props}, ref) => {
    const {colors} = useTheme();

    const snapPoints = useMemo(() => ['60%', '85%'], []);
    const [index, setIndex] = React.useState(-1);

    useEffect(() => {
      const handleBackPress = () => {
        // Check if the modal is open
        if (index > 0) {
          ref.current?.dismiss();
        } else {
          if (router.canGoBack()) {
            console.log('Can go back');
            router.back();
          } else {
            BackHandler.exitApp();
          }
        }
        return true; // Prevent default back action (exit app)
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => backHandler.remove(); // Cleanup
    }, [index, ref]);

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
        index={1}
        onChange={index => {
          console.log('index: ', index);
          setIndex(index);
        }}
        snapPoints={snapPoints}
        backgroundStyle={{backgroundColor: colors.background}}
        handleIndicatorStyle={{backgroundColor: colors.onSurface}}
        keyboardBehavior="extend"
        stackBehavior="replace">
        {(data: Todo) => (
          <BottomSheetScrollView style={styles.contentContainer}>
            {typeof children === 'function' ? children(data) : children}
          </BottomSheetScrollView>
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export default EditTodoModal;
