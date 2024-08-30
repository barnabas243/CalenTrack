import React, {useEffect, useRef, useState} from 'react';
import {Banner} from 'react-native-paper';

export interface ConnectionStatusBannerProps {
  isConnected: boolean;
}

const ConnectionStatusBanner = ({isConnected}: ConnectionStatusBannerProps) => {
  const [visible, setVisible] = useState<boolean>(false);
  const hasMounted = useRef<boolean>(false);

  useEffect(() => {
    if (hasMounted.current) {
      // Update visibility based on connection status
      setVisible(true);

      if (isConnected) {
        // Hide the banner after a delay if connected
        setTimeout(() => {
          handleCloseBanner();
        }, 3000); // Hide after 3 seconds
      }
    } else {
      // Set the mounted ref to true
      hasMounted.current = true;

      if (!isConnected) {
        // still show the banner if not connected
        setVisible(true);
      }
    }
  }, [isConnected]);

  const handleCloseBanner = () => {
    setVisible(false);
  };

  return (
    <>
      {!isConnected && visible && (
        <Banner
          visible={!isConnected && visible}
          actions={[
            {
              label: 'OK',
              onPress: handleCloseBanner,
            },
          ]}>
          No Internet Connection. Some features may not be available.
        </Banner>
      )}
      {isConnected && visible && (
        <Banner
          visible={isConnected && visible}
          actions={[
            {
              label: 'Got it',
              onPress: handleCloseBanner,
            },
          ]}>
          You are back online.
        </Banner>
      )}
    </>
  );
};

export default ConnectionStatusBanner;
