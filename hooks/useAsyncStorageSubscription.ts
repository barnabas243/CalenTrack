import {useEffect, useState, useRef} from 'react';
import {getSetting} from '@/utils/settingUtils';

const useAsyncStorageSubscription = (key: string, interval: number = 500) => {
  const [value, setValue] = useState<string | null>(null);
  const prevValueRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchValue = async () => {
      try {
        const storedValue = (await getSetting(key)) as string;

        if (storedValue !== prevValueRef.current) {
          prevValueRef.current = storedValue;
          setValue(storedValue);
        }
      } catch (error) {
        console.error('Error fetching from AsyncStorage:', error);
      }
    };

    fetchValue(); // Fetch the initial value immediately

    const intervalId = setInterval(fetchValue, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [key, interval]); // Only depend on key and interval

  return value;
};

export default useAsyncStorageSubscription;
