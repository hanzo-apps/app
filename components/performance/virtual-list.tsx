'use client';

import React, { useRef, useCallback, useMemo } from 'react';

// Type definitions for react-window
type ListChildComponentProps = {
  index: number;
  style: React.CSSProperties;
  data?: any;
};

// Mock implementations for now - will be replaced with actual react-window
const FixedSizeList = ({ children, height, width, itemCount, itemSize, itemData }: any) => {
  return (
    <div style={{ height, width, overflow: 'auto' }}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {children({ index, style: { height: itemSize }, data: itemData })}
        </div>
      ))}
    </div>
  );
};

const VariableSizeList = FixedSizeList; // Simplified for now
import { cn } from '@/lib/utils';

// Simple AutoSizer component wrapper
const AutoSizer = ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 800, height: 600 });

  React.useEffect(() => {
    if (!ref.current) return;

    const updateSize = () => {
      if (ref.current) {
        setSize({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return <div ref={ref} style={{ width: '100%', height: '100%' }}>{children(size)}</div>;
};

export interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollOffset: number) => void;
  onItemsRendered?: (props: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => void;
}

export function VirtualList<T>({
  items,
  height = '100%',
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll,
  onItemsRendered,
}: VirtualListProps<T>) {
  const listRef = useRef<any>(null);

  const isFixedHeight = typeof itemHeight === 'number';

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return <div style={style}>{renderItem(item, index, style)}</div>;
    },
    [items, renderItem]
  );

  const handleItemsRendered = useCallback(
    ({
      visibleStartIndex,
      visibleStopIndex,
    }: {
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => {
      onItemsRendered?.({ visibleStartIndex, visibleStopIndex });
    },
    [onItemsRendered]
  );

  const content = (width: number, height: number) => {
    if (isFixedHeight) {
      return (
        <FixedSizeList
          ref={listRef}
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight as number}
          overscanCount={overscan}
          onScroll={({ scrollOffset }) => onScroll?.(scrollOffset)}
          onItemsRendered={handleItemsRendered}
          className={className}
        >
          {Row}
        </FixedSizeList>
      );
    } else {
      return (
        <VariableSizeList
          ref={listRef}
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight as (index: number) => number}
          overscanCount={overscan}
          onScroll={({ scrollOffset }) => onScroll?.(scrollOffset)}
          onItemsRendered={handleItemsRendered}
          className={className}
        >
          {Row}
        </VariableSizeList>
      );
    }
  };

  if (typeof height === 'number') {
    return (
      <div style={{ width: '100%', height }}>
        <AutoSizer>
          {({ width }) => content(width, height)}
        </AutoSizer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <AutoSizer>
        {({ width, height }) => content(width, height)}
      </AutoSizer>
    </div>
  );
}

// Virtual Grid Component
export interface VirtualGridProps<T> {
  items: T[];
  columnCount: number;
  rowHeight: number | ((index: number) => number);
  columnWidth: number | ((index: number) => number);
  height?: number | string;
  width?: number | string;
  renderCell: (
    item: T,
    rowIndex: number,
    columnIndex: number,
    style: React.CSSProperties
  ) => React.ReactNode;
  overscan?: number;
  className?: string;
}

// Grid components - simplified implementations
const FixedSizeGrid = ({ children, height, width, rowCount, columnCount, rowHeight, columnWidth, itemData }: any) => {
  return (
    <div style={{ height, width, overflow: 'auto' }}>
      {children}
    </div>
  );
};

const VariableSizeGrid = FixedSizeGrid;

export function VirtualGrid<T>({
  items,
  columnCount,
  rowHeight,
  columnWidth,
  height = '100%',
  width = '100%',
  renderCell,
  overscan = 1,
  className,
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);
  const isFixedSize = typeof rowHeight === 'number' && typeof columnWidth === 'number';

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: any) => {
      const index = rowIndex * columnCount + columnIndex;
      if (index >= items.length) return null;

      const item = items[index];
      return (
        <div style={style}>
          {renderCell(item, rowIndex, columnIndex, style)}
        </div>
      );
    },
    [items, columnCount, renderCell]
  );

  const content = (width: number, height: number) => {
    if (isFixedSize) {
      return (
        <FixedSizeGrid
          columnCount={columnCount}
          columnWidth={columnWidth as number}
          height={height}
          rowCount={rowCount}
          rowHeight={rowHeight as number}
          width={width}
          overscanRowCount={overscan}
          overscanColumnCount={overscan}
          className={className}
        >
          {Cell}
        </FixedSizeGrid>
      );
    } else {
      return (
        <VariableSizeGrid
          columnCount={columnCount}
          columnWidth={columnWidth as (index: number) => number}
          height={height}
          rowCount={rowCount}
          rowHeight={rowHeight as (index: number) => number}
          width={width}
          overscanRowCount={overscan}
          overscanColumnCount={overscan}
          className={className}
        >
          {Cell}
        </VariableSizeGrid>
      );
    }
  };

  if (typeof height === 'number' && typeof width === 'number') {
    return content(width, height);
  }

  return (
    <div style={{ width, height }}>
      <AutoSizer>
        {({ width, height }) => content(width, height)}
      </AutoSizer>
    </div>
  );
}

// Infinite Scroll Virtual List
export interface InfiniteVirtualListProps<T> extends VirtualListProps<T> {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number;
}

export function InfiniteVirtualList<T>({
  items,
  loadMore,
  hasMore,
  isLoading = false,
  threshold = 5,
  ...props
}: InfiniteVirtualListProps<T>) {
  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }: { visibleStartIndex: number; visibleStopIndex: number }) => {
      if (
        hasMore &&
        !isLoading &&
        visibleStopIndex >= items.length - threshold
      ) {
        loadMore();
      }

      props.onItemsRendered?.({
        visibleStartIndex: visibleStopIndex,
        visibleStopIndex,
      });
    },
    [hasMore, isLoading, items.length, threshold, loadMore, props]
  );

  const itemsWithLoader = useMemo(() => {
    if (isLoading) {
      return [...items, { __loader: true }];
    }
    return items;
  }, [items, isLoading]);

  const renderItemWithLoader = useCallback(
    (item: any, index: number, style: React.CSSProperties) => {
      if (item.__loader) {
        return (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
          </div>
        );
      }
      return props.renderItem(item, index, style);
    },
    [props]
  );

  return (
    <VirtualList
      {...props}
      items={itemsWithLoader}
      renderItem={renderItemWithLoader}
      onItemsRendered={handleItemsRendered}
    />
  );
}

// Table Virtualization
export interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width: number;
  render: (item: T) => React.ReactNode;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  height?: number | string;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  height = 400,
  className,
  headerClassName,
  rowClassName,
}: VirtualTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  const renderRow = useCallback(
    (item: T, index: number, style: React.CSSProperties) => {
      const rowClass = typeof rowClassName === 'function'
        ? rowClassName(item, index)
        : rowClassName;

      return (
        <div
          style={style}
          className={cn(
            'flex items-center border-b border-gray-200 dark:border-gray-700',
            rowClass
          )}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              style={{ width: column.width }}
              className="px-2 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {column.render(item)}
            </div>
          ))}
        </div>
      );
    },
    [columns, rowClassName]
  );

  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold',
          headerClassName
        )}
        style={{ height: rowHeight, width: totalWidth }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-2 overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <VirtualList
        items={data}
        height={height}
        itemHeight={rowHeight}
        renderItem={renderRow}
        className="scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
      />
    </div>
  );
}

export default VirtualList;