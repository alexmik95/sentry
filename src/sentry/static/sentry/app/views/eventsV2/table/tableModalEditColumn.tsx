import React, {ReactText} from 'react';
import styled from '@emotion/styled';
import uniq from 'lodash/uniq';

import {trackAnalyticsEvent} from 'app/utils/analytics';
import {t} from 'app/locale';
import {DISCOVER2_DOCS_URL} from 'app/constants';
import {Form, SelectField} from 'app/components/forms';
import Link from 'app/components/links/link';
import {IconChevron, IconDocs} from 'app/icons';
import {Organization} from 'app/types';
import space from 'app/styles/space';

import {
  AGGREGATIONS,
  FIELDS,
  TRACING_FIELDS,
  Aggregation,
  Field,
  ColumnType,
} from '../eventQueryParams';
import {TableColumn} from './types';

type ModalActions = {
  createColumn: (column: TableColumn<ReactText>, insertAt?: number) => void;
  updateColumn: (indexColumnOrder: number, column: TableColumn<ReactText>) => void;
};

export function renderTableModalEditColumnFactory(
  organization: Organization,
  tagKeys: null | string[],
  actions: ModalActions
) {
  return {
    renderModalBodyWithForm: (
      indexColumnOrder?: number,
      column?: TableColumn<ReactText>,
      onSuccessFromChild?: () => void,
      onErrorFromChild?: (error?: Error) => void
    ) => (
      <TableModalEditColumnBodyForm
        organization={organization}
        indexColumnOrder={indexColumnOrder}
        column={column}
        tagKeys={tagKeys}
        actions={{
          createColumn: actions.createColumn,
          updateColumn: actions.updateColumn,
          onSuccess: onSuccessFromChild,
          onError: onErrorFromChild,
        }}
      />
    ),
    renderModalFooter: () => <TableModalEditColumnFooter />,
  };
}

export default renderTableModalEditColumnFactory;

type TableModalEditColumnFormProps = {
  organization: Organization;
  indexColumnOrder?: number;
  column?: TableColumn<ReactText>;
  tagKeys: null | string[];

  actions: ModalActions & {
    onSuccess?: () => void;
    onError?: (error?: Error) => void;
  };
};
type TableModalEditColumnFormState = {
  aggregations: Aggregation[];
  fields: Field[];
};

class TableModalEditColumnBodyForm extends React.Component<
  TableModalEditColumnFormProps,
  TableModalEditColumnFormState
> {
  state = {
    aggregations: filterAggregationByField(
      this.props.organization,
      this.props.column ? this.props.column.field : ''
    ),
    fields: filterFieldByAggregation(
      this.props.organization,
      this.props.tagKeys,
      this.props.column ? this.props.column.aggregation : ''
    ),
  };

  componentDidMount() {
    const {column, indexColumnOrder, organization} = this.props;

    const isEditing = !!column;
    const focusedColumnIndex =
      typeof indexColumnOrder === 'number' && indexColumnOrder >= 0
        ? indexColumnOrder
        : -1;

    if (isEditing) {
      if (typeof indexColumnOrder === 'number') {
        // metrics
        trackAnalyticsEvent({
          eventKey: 'discover_v2.edit_column.open_modal',
          eventName: 'Discoverv2: Opened modal to edit a column',
          index: focusedColumnIndex,
          organization_id: parseInt(organization.id, 10),
        });
      }
    } else {
      // metrics
      trackAnalyticsEvent({
        eventKey: 'discover_v2.add_column.open_modal',
        eventName: 'Discoverv2: Opened modal to add a column',
        index: focusedColumnIndex,
        organization_id: parseInt(organization.id, 10),
      });
    }
  }

  onChangeAggregation = (value: Aggregation) => {
    const {organization, tagKeys} = this.props;
    this.setState({
      fields: filterFieldByAggregation(organization, tagKeys, value),
    });
  };

  onChangeField = (value: Field) => {
    this.setState({
      aggregations: filterAggregationByField(this.props.organization, value),
    });
  };

  onSubmitForm = (values: any) => {
    const {indexColumnOrder, column} = this.props;
    const {createColumn, updateColumn, onSuccess, onError} = this.props.actions;
    const nextColumn: TableColumn<ReactText> = {...column, ...values};

    try {
      if (typeof indexColumnOrder === 'number' && this.props.column) {
        updateColumn(indexColumnOrder, nextColumn);
      } else {
        createColumn(nextColumn, indexColumnOrder);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      if (onError) {
        onError(e);
      }
    }
  };

  render() {
    const {column} = this.props;

    return (
      <React.Fragment>
        <Form
          onSubmit={v => this.onSubmitForm(v)}
          submitLabel={column ? t('Update column') : t('Create column')}
          initialData={{
            aggregation: column ? column.aggregation : '',
            field: column ? column.field : '',
          }}
        >
          <FormRow>
            <SelectField
              deprecatedSelectControl
              name="aggregation"
              label={t('Aggregate')}
              placeholder="Select Aggregate"
              choices={this.state.aggregations}
              onChange={this.onChangeAggregation}
            />
            <SelectField
              deprecatedSelectControl
              required
              name="field"
              label={t('Column Type')}
              placeholder="Select Column Type"
              choices={this.state.fields}
              onChange={this.onChangeField}
            />
          </FormRow>
        </Form>
      </React.Fragment>
    );
  }
}

const TableModalEditColumnFooter = () => (
  <FooterContent href={`${DISCOVER2_DOCS_URL}query-builder/`} target="_blank">
    <StyledIconDocs /> {t('Read the docs')}
    <StyledIconChevron direction="right" size="xs" />
  </FooterContent>
);

function filterAggregationByField(organization: Organization, f?: Field): Aggregation[] {
  let functionList = Object.keys(AGGREGATIONS);
  if (!organization.features.includes('transaction-events')) {
    functionList = functionList.filter(item => !TRACING_FIELDS.includes(item));
  }

  // sort list in ascending order
  functionList.sort();

  if (!f) {
    return functionList as Aggregation[];
  }
  // Unknown fields are likely tag keys and thus strings.
  const fieldType = FIELDS[f] || 'string';

  if (fieldType === 'never') {
    return [];
  }

  functionList = functionList.reduce((accumulator, a) => {
    if (
      AGGREGATIONS[a].type.includes(fieldType) ||
      AGGREGATIONS[a].type === '*' ||
      fieldType === '*'
    ) {
      accumulator.push(a as Aggregation);
    }

    return accumulator;
  }, [] as Aggregation[]);

  // sort list in ascending order
  functionList.sort();

  return functionList as Aggregation[];
}

function filterFieldByAggregation(
  organization: Organization,
  tagKeys: null | string[],
  a?: Aggregation
): Field[] {
  let fieldList = Object.keys(FIELDS);
  if (tagKeys && tagKeys.length) {
    fieldList = uniq(fieldList.concat(tagKeys));
  }
  if (!organization.features.includes('transaction-events')) {
    fieldList = fieldList.filter(item => !TRACING_FIELDS.includes(item));
  }

  // sort list in ascending order
  fieldList.sort();

  if (!a || !AGGREGATIONS[a]) {
    return fieldList as Field[];
  }

  fieldList = fieldList.reduce((accumulator, f) => {
    // tag keys are all strings, and values not in FIELDS is a tag.
    const fieldType = FIELDS[f] || 'string';
    if (fieldType === 'never' || typeof AGGREGATIONS[a] === 'undefined') {
      return accumulator;
    }

    const aggregate = AGGREGATIONS[a];
    // Acts as a cast to get around the `as const` type narrowing.
    const aggregateType: ColumnType[] = [...aggregate.type];
    if (aggregateType.includes('*') || aggregateType.includes(fieldType as ColumnType)) {
      accumulator.push(f as Field);
    }

    return accumulator;
  }, [] as Field[]);

  // sort list in ascending order
  fieldList.sort();

  return fieldList;
}

const FormRow = styled('div')`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 35% auto;
  grid-column-gap: ${space(2)};
`;

const FooterContent = styled(Link)`
  display: flex;
  align-items: center;
  flex-grow: 1;
  color: inherit;
`;

const StyledIconDocs = styled(IconDocs)`
  margin-right: ${space(1)};
`;

const StyledIconChevron = styled(IconChevron)`
  margin-left: auto;
`;
