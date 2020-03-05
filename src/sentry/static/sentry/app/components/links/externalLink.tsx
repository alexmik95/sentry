import React from 'react';

type Props = {
  href: string;
  className?: string;
};

const ExternalLink = React.forwardRef<HTMLAnchorElement, Props>((props, ref) => (
  <a {...props} ref={ref} target="_blank" rel="noreferrer noopener" />
));

export default ExternalLink;
