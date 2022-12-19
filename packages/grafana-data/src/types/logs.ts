import { Observable } from 'rxjs';

import { Labels } from './data';
import { DataFrame } from './dataFrame';
import { DataQueryRequest, DataQueryResponse, DataSourceApi } from './datasource';
import { DataQuery } from './query';
import { AbsoluteTimeRange } from './time';

/**
 * Mapping of log level abbreviation to canonical log level.
 * Supported levels are reduce to limit color variation.
 */
export enum LogLevel {
  emerg = 'critical',
  fatal = 'critical',
  alert = 'critical',
  crit = 'critical',
  critical = 'critical',
  warn = 'warning',
  warning = 'warning',
  err = 'error',
  eror = 'error',
  error = 'error',
  info = 'info',
  information = 'info',
  informational = 'info',
  notice = 'info',
  dbug = 'debug',
  debug = 'debug',
  trace = 'trace',
  unknown = 'unknown',
}

// Used for meta information such as common labels or returned log rows in logs view in Explore
export enum LogsMetaKind {
  Number,
  String,
  LabelsMap,
  Error,
}

export enum LogsSortOrder {
  Descending = 'Descending',
  Ascending = 'Ascending',
}

export interface LogsMetaItem {
  label: string;
  value: string | number | Labels;
  kind: LogsMetaKind;
}

export interface LogRowModel {
  // Index of the field from which the entry has been created so that we do not show it later in log row details.
  entryFieldIndex: number;

  // Index of the row in the dataframe. As log rows can be stitched from multiple dataFrames, this does not have to be
  // the same as rows final index when rendered.
  rowIndex: number;

  // Full DataFrame from which we parsed this log.
  // TODO: refactor this so we do not need to pass whole dataframes in addition to also parsed data.
  dataFrame: DataFrame;
  duplicates?: number;

  // Actual log line
  entry: string;
  hasAnsi: boolean;
  hasUnescapedContent: boolean;
  labels: Labels;
  logLevel: LogLevel;
  raw: string;
  searchWords?: string[];
  timeFromNow: string;
  timeEpochMs: number;
  // timeEpochNs stores time with nanosecond-level precision,
  // as millisecond-level precision is usually not enough for proper sorting of logs
  timeEpochNs: string;
  timeLocal: string;
  timeUtc: string;
  uid: string;
  uniqueLabels?: Labels;
  datasourceType?: string;
}

export interface LogsModel {
  hasUniqueLabels: boolean;
  meta?: LogsMetaItem[];
  rows: LogRowModel[];
  series?: DataFrame[];
  // visibleRange is time range for histogram created from log results
  visibleRange?: AbsoluteTimeRange;
  queries?: DataQuery[];
}

export interface LogSearchMatch {
  start: number;
  length: number;
  text: string;
}

export interface LogLabelStatsModel {
  active?: boolean;
  count: number;
  proportion: number;
  value: string;
}

export enum LogsDedupStrategy {
  none = 'none',
  exact = 'exact',
  numbers = 'numbers',
  signature = 'signature',
}

/** @deprecated will be removed in the next major version */
export interface LogsParser {
  /**
   * Value-agnostic matcher for a field label.
   * Used to filter rows, and first capture group contains the value.
   */
  buildMatcher: (label: string) => RegExp;

  /**
   * Returns all parsable substrings from a line, used for highlighting
   */
  getFields: (line: string) => string[];

  /**
   * Gets the label name from a parsable substring of a line
   */
  getLabelFromField: (field: string) => string;

  /**
   * Gets the label value from a parsable substring of a line
   */
  getValueFromField: (field: string) => string;
  /**
   * Function to verify if this is a valid parser for the given line.
   * The parser accepts the line if it returns true.
   */
  test: (line: string) => boolean;
}

export enum LogsDedupDescription {
  none = 'No de-duplication',
  exact = 'De-duplication of successive lines that are identical, ignoring ISO datetimes.',
  numbers = 'De-duplication of successive lines that are identical when ignoring numbers, e.g., IP addresses, latencies.',
  signature = 'De-duplication of successive lines that have identical punctuation and whitespace.',
}

/**
 * Data sources that allow showing context rows around the provided LowRowModel should implement this method.
 * This will enable "context" button in Logs Panel.
 */
export interface DataSourceWithLogsContextSupport<TQuery extends DataQuery = DataQuery> {
  /**
   * Retrieve context for a given log row
   */
  getLogRowContext: <TContextQueryOptions extends {}>(
    row: LogRowModel,
    options?: TContextQueryOptions,
    query?: TQuery
  ) => Promise<DataQueryResponse>;

  /**
   * This method can be used to show "context" button based on runtime conditions (for example row model data or plugin settings, etc.)
   */
  showContextToggle(row?: LogRowModel): boolean;
}

export const hasLogsContextSupport = (datasource: unknown): datasource is DataSourceWithLogsContextSupport => {
  if (!datasource) {
    return false;
  }
  // Typescript documentation recommends to use this approach to check if a property exists on an object
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const withLogsSupport = datasource as DataSourceWithLogsContextSupport;

  return withLogsSupport.getLogRowContext !== undefined && withLogsSupport.showContextToggle !== undefined;
};

/**
 * Data sources that support log volume.
 * This will enable full-range log volume histogram in Explore.
 */
export interface DataSourceWithLogsVolumeSupport<TQuery extends DataQuery> {
  getLogsVolumeDataProvider(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse> | undefined;
}

export const hasLogsVolumeSupport = <TQuery extends DataQuery>(
  datasource: unknown
): datasource is DataSourceWithLogsVolumeSupport<TQuery> => {
  // Typescript documentation recommends to use this approach to check if a property exists on an object
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (datasource as DataSourceWithLogsVolumeSupport<TQuery>).getLogsVolumeDataProvider !== undefined;
};
