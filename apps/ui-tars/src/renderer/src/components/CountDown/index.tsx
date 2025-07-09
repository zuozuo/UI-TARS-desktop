import CountUp from 'react-countup';
// import { Gift, CircleArrowUp } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { RemoteResourceStatus } from '@renderer/hooks/useRemoteResource';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@renderer/components/ui/hover-card';
import { Button } from '@renderer/components/ui/button';
import { Operator } from '@main/store/types';

interface CountDownProps {
  operator: Operator;
  start?: number;
  status: RemoteResourceStatus;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const map = {
  [Operator.RemoteComputer]: {
    text: 'If you need to use it for a long-term and stable period, you can log in to the Volcano Engine FaaS to experience the Online Computer Use Agent.',
    url: 'https://console.volcengine.com/vefaas/region:vefaas+cn-beijing/market/computer/?channel=github&source=UI-TARS',
  },
  [Operator.RemoteBrowser]: {
    text: 'If you need to use it for a long-term and stable period, you can log in to the Volcano Engine FaaS to experience the Online Browser Use Agent.',
    url: 'https://console.volcengine.com/vefaas/region:vefaas+cn-beijing/market/browser/?channel=github&source=UI-TARS',
  },
};

const UpgradeCard = memo(({ operator }: { operator: Operator }) => (
  <HoverCardContent className="w-72 p-4" sideOffset={10}>
    <div>
      {/* <div className="flex items-center gap-2 mb-2"> */}
      {/* <CircleArrowUp className="h-5 w-5" /> */}
      {/* <h3 className="text-lg font-semibold">Upgrade</h3> */}
      {/* </div> */}
      <p className="text-sm text-gray-600 mb-4">{map[operator]?.text}</p>
      <Button
        className="w-full"
        onClick={() => window.open(map[operator]?.url, '_blank')}
      >
        Learn more
      </Button>
    </div>
  </HoverCardContent>
));

export const CountDown = memo(
  ({ operator, status, start = 0 }: CountDownProps) => {
    const [showUpgrade, setShowUpgrade] = useState(false);

    useEffect(() => {
      if (start >= 30 * 60 * 1000) {
        setShowUpgrade(true);
      }
    }, [start]);

    return (
      <div
        className="flex items-center gap-2 rounded-md bg-green-50 px-3 h-8 text-sm cursor-default"
        style={{ '-webkit-app-region': 'no-drag' }}
      >
        {/* <Gift className="!h-4 !w-4 text-yellow-500" /> */}
        <span className="text-gray-700">
          <span className="font-medium">30</span>-minute free credit
        </span>
        {status === 'connected' && (
          <CountUp
            className="font-mono font-medium"
            start={start}
            end={30 * 60}
            duration={30 * 60}
            formattingFn={formatTime}
            useEasing={false}
          />
        )}
        <div className="w-0.5 h-4 bg-gray-200"></div>
        <HoverCard
          open={showUpgrade}
          openDelay={0}
          closeDelay={100}
          onOpenChange={setShowUpgrade}
        >
          <HoverCardTrigger asChild>
            <a className="ml-auto text-blue-500 hover:text-blue-600 hover:underline cursor-pointer">
              Learn more
            </a>
          </HoverCardTrigger>
          <UpgradeCard operator={operator} />
        </HoverCard>
      </div>
    );
  },
);
