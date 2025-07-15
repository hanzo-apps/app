import React from 'react';
import { observer } from 'mobx-react-lite';
import { uiStore } from '@/stores/ui.store';

const CalendarWidget = observer(() => {
  return (
    <div className="widget calendar-widget">
      <div className="widget-header mb-4">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <p className="text-sm text-text-secondary">
          Your upcoming events • ESC to go back
        </p>
      </div>

      <div className="calendar-content">
        <p className="text-text-secondary">
          Calendar integration coming soon...
        </p>
      </div>

      <button
        onClick={() => uiStore.setWidget('search')}
        className="btn-secondary mt-4"
      >
        Back to Search
      </button>
    </div>
  );
});

export default CalendarWidget;