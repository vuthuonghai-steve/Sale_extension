import { useEffect, useState } from 'react';
import type { ZaloTabStatus } from '../types/sidepanel-ui.types';
import { SidepanelBridgeService } from '../services/sidepanel-bridge.service';

const bridge = new SidepanelBridgeService();

export function useZaloTabStatus() {
  const [status, setStatus] = useState<ZaloTabStatus>({
    isConnected: false,
    isZaloWeb: false,
    activeConversation: '',
  });

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      const current = await bridge.fetchActiveZaloTabStatus();
      if (isMounted) {
        setStatus(current);
      }
    };

    void checkStatus();

    // Check periodically every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
