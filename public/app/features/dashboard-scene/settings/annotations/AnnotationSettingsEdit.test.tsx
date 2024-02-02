import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { of } from 'rxjs';

import {
  AnnotationQuery,
  FieldType,
  LoadingState,
  PanelData,
  VariableSupportType,
  getDefaultTimeRange,
  toDataFrame,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { setRunRequest } from '@grafana/runtime';
import { mockDataSource } from 'app/features/alerting/unified/mocks';
import { LegacyVariableQueryEditor } from 'app/features/variables/editor/LegacyVariableQueryEditor';

import { AnnotationSettingsEdit } from './AnnotationSettingsEdit';

const defaultDatasource = mockDataSource({
  name: 'Default Test Data Source',
  type: 'test',
});

const promDatasource = mockDataSource({
  name: 'Prometheus',
  type: 'prometheus',
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getAngularLoader: () => ({
    load: () => ({
      destroy: jest.fn(),
      digest: jest.fn(),
      getScope: () => ({
        $watch: jest.fn(),
      }),
    }),
  }),
}));

jest.mock('@grafana/runtime/src/services/dataSourceSrv', () => ({
  ...jest.requireActual('@grafana/runtime/src/services/dataSourceSrv'),
  getDataSourceSrv: () => ({
    get: async () => ({
      ...defaultDatasource,
      variables: {
        getType: () => VariableSupportType.Custom,
        query: jest.fn(),
        editor: jest.fn().mockImplementation(LegacyVariableQueryEditor),
      },
    }),
    getList: () => [defaultDatasource, promDatasource],
    getInstanceSettings: () => ({ ...defaultDatasource }),
  }),
}));

jest.mock('./AngularEditorLoader', () => ({ AngularEditorLoader: () => 'mocked AngularEditorLoader' }));

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    series: [
      toDataFrame({
        fields: [{ name: 'text', type: FieldType.string, values: ['val1', 'val2', 'val11'] }],
      }),
    ],
    timeRange: getDefaultTimeRange(),
  })
);

setRunRequest(runRequestMock);

describe('AnnotationSettingsEdit', () => {
  const mockOnUpdate = jest.fn();
  const mockGoBackToList = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnPreview = jest.fn();

  function setup() {
    const annotationQuery: AnnotationQuery = {
      name: 'test',
      datasource: defaultDatasource,
      enable: true,
      hide: false,
      iconColor: 'blue',
    };

    const props = {
      annotation: annotationQuery,
      onUpdate: mockOnUpdate,
      editIndex: 1,
      panels: [],
      goBackToList: mockGoBackToList,
      onDelete: mockOnDelete,
      onPreview: mockOnPreview,
    };

    return {
      anno: annotationQuery,
      renderer: render(<AnnotationSettingsEdit {...props} />),
      user: userEvent.setup(),
    };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render', async () => {
    const {
      renderer: { getByTestId },
    } = setup();

    await waitFor(() => {
      const nameInput = getByTestId(selectors.pages.Dashboard.Settings.Annotations.Settings.name);
      const dataSourceSelect = getByTestId(selectors.components.DataSourcePicker.container);
      const enableToggle = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.enable);
      const hideToggle = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.hide);
      const iconColorToggle = getByTestId(selectors.components.ColorSwatch.name);
      const panelSelect = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.showInLabel);
      const preview = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.previewInDashboard);
      const deleteAnno = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.delete);
      const apply = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.apply);

      expect(nameInput).toBeInTheDocument();
      expect(dataSourceSelect).toBeInTheDocument();
      expect(enableToggle).toBeInTheDocument();
      expect(hideToggle).toBeInTheDocument();
      expect(iconColorToggle).toBeInTheDocument();
      expect(panelSelect).toBeInTheDocument();
      expect(preview).toBeInTheDocument();
      expect(deleteAnno).toBeInTheDocument();
      expect(apply).toBeInTheDocument();
    });
  });

  it('should update annotation name on change', async () => {
    const {
      renderer: { getByTestId },
      user,
    } = setup();

    await waitFor(async () => {
      await user.type(getByTestId(selectors.pages.Dashboard.Settings.Annotations.Settings.name), 'new name');
    });

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('should update annotation datasource on change', async () => {
    const {
      renderer: { getByTestId },
      user,
      anno,
    } = setup();

    const annoArg = {
      ...anno,
      datasource: {
        type: 'test',
        uid: 'mock-ds-2',
      },
    };

    const dataSourcePicker = getByTestId(selectors.components.DataSourcePicker.inputV2);
    await waitFor(async () => {
      await user.click(dataSourcePicker); // open the select
      await userEvent.tab();
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(annoArg, 1);
  });

  it('should toggle annotation enabled on change', async () => {
    const {
      renderer: { getByTestId },
      user,
      anno,
    } = setup();

    const annoArg = {
      ...anno,
      enable: !anno.enable,
    };

    const enableToggle = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.enable);
    await waitFor(async () => {
      await user.click(enableToggle);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(annoArg, 1);
  });

  it('should toggle annotation hide on change', async () => {
    const {
      renderer: { getByTestId },
      user,
      anno,
    } = setup();

    const annoArg = {
      ...anno,
      hide: !anno.hide,
    };

    const hideToggle = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.hide);
    await waitFor(async () => {
      await user.click(hideToggle);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(annoArg, 1);
  });

  it('should set annotation filter', async () => {
    const {
      renderer: { getByTestId },
      user,
    } = setup();

    const panelSelect = getByTestId(selectors.components.Annotations.annotationsTypeInput);
    await waitFor(async () => {
      await user.click(panelSelect);
      await user.tab();
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ filter: undefined }), 1);
  });

  it('should delete annotation', async () => {
    const {
      renderer: { getByTestId },
      user,
    } = setup();

    const deleteAnno = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.delete);
    await waitFor(async () => {
      await user.click(deleteAnno);
    });

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should preview annotation', async () => {
    const {
      renderer: { getByTestId },
      user,
    } = setup();

    const preview = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.previewInDashboard);
    await waitFor(async () => {
      await user.click(preview);
    });

    expect(mockOnPreview).toHaveBeenCalledTimes(1);
  });

  it('should apply annotation', async () => {
    const {
      renderer: { getByTestId },
      user,
    } = setup();

    const apply = getByTestId(selectors.pages.Dashboard.Settings.Annotations.NewAnnotation.apply);
    await waitFor(async () => {
      await user.click(apply);
    });

    expect(mockGoBackToList).toHaveBeenCalledTimes(1);
  });
});
