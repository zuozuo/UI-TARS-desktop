import { Box } from '@chakra-ui/react';

import './index.scss';

interface ThinkingProps {
  children: React.ReactNode;
  className?: string;
}

export default (props: ThinkingProps) => {
  return (
    <Box as="span" className="loading-shimmer">
      {props.children}
    </Box>
  );
};
