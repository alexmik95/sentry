import React from 'react';
import PropTypes from 'prop-types';

import Button from 'app/components/button';

import ExternalLink from './externalLink';

type Props = {
  // Optional URL, used when `Link` is rendered as an `<a />`
  href?: string;
  // Optional prop to make an anchor open in a new tab
  external?: boolean;
  // Link content (accepted via string or components / DOM nodes)
  children?: React.ReactNode;
  // Action to perform when clicked (will cause the component to be rendered as a button instead of an anchor)
  onClick?: (event?: React.MouseEvent) => void;
  // Styles applied to the component's root
  className?: string;
};

type LinkRef = HTMLAnchorElement | HTMLButtonElement;

const Link = React.forwardRef<LinkRef, Props>(
  ({href = '#', external = false, onClick, ...props}, ref) => {
    if (onClick) {
      return <Button onClick={onClick} href={href} ref={ref} {...props} />;
    }

    const anchorRef = ref as React.RefObject<HTMLAnchorElement>;

    if (external) {
      return <ExternalLink href={href} ref={anchorRef} {...props} />;
    }

    return <a href={href} ref={anchorRef} {...props} />;
  }
);

Link.propTypes = {
  href: PropTypes.string,
  external: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Link;
