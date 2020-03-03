import React from 'react';
import styled from '@emotion/styled';

import Link from 'app/components/links/link';
import {IconChevron} from 'app/icons';
import space from 'app/styles/space';

type Crumb = {
  label: React.ReactNode;
  to?: string;
};

type Props = {
  crumbs: Crumb[];
};

const Breadcrumbs = ({crumbs}: Props) => {
  return (
    <BreadcrumbList>
      {crumbs.map((crumb, index) => {
        return (
          <React.Fragment key={crumb.to}>
            <BreadcrumbItem to={crumb.to}>{crumb.label}</BreadcrumbItem>
            {index < crumbs.length - 1 && <StyledIcon direction="right" />}
          </React.Fragment>
        );
      })}
    </BreadcrumbList>
  );
};

export default Breadcrumbs;

const BreadcrumbList = styled('span')`
  display: flex;
  align-items: center;
  height: 40px;
`;

const BreadcrumbItem = styled(Link)`
  color: ${p => p.theme.gray2};

  &:last-child {
    color: ${p => p.theme.gray4};
    pointer-events: none;
  }

  &:hover,
  &:active {
    color: ${p => p.theme.gray3};
  }
`;

const StyledIcon = styled(IconChevron)`
  color: ${p => p.theme.gray2};
  height: 12px;
  width: 12px;
  margin: 0 ${space(1)} ${space(0.5)} ${space(1)};
`;
