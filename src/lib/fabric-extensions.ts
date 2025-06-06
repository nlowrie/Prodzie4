// Add the following method to the fabric.Object prototype
fabric.Object.prototype.setBacklogLink = function(backlogId: string | null) {
  if (!this.data) {
    this.data = { id: Math.random().toString(36).substr(2, 9) };
  }
  this.data.linked_backlog_id = backlogId;
  
  // Update visual appearance
  if (backlogId) {
    this.set({
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5]
    });
  } else {
    this.set({
      stroke: this.get('originalStroke') || null,
      strokeWidth: this.get('originalStrokeWidth') || 0,
      strokeDashArray: null
    });
  }
};