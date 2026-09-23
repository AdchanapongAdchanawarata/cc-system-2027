export type ActionType = 
  | 'UPDATE_FIELD'
  | 'MOVE_STATUS'
  | 'CHANGE_ASSIGNEE'
  | 'DELETE_TO_TRASH'
  | 'RESTORE_FROM_TRASH'
  | 'DUPLICATE_TASK';

export interface HistoryAction {
  id: string;
  type: ActionType;
  description: string;
  briefId: string;
  timestamp: number;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export const MAX_HISTORY_STACK = 50;

export class HistoryManager {
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];
  private listeners: (() => void)[] = [];

  constructor(private maxStack: number = MAX_HISTORY_STACK) {}

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public push(action: HistoryAction) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxStack) {
      this.undoStack.shift();
    }
    // Any new action clears redo stack
    this.redoStack = [];
    this.notify();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public getLastUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  public getLastRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }

  public async undo(): Promise<HistoryAction | null> {
    const action = this.undoStack.pop();
    if (!action) return null;

    try {
      await action.undo();
      this.redoStack.push(action);
      if (this.redoStack.length > this.maxStack) {
        this.redoStack.shift();
      }
      this.notify();
      return action;
    } catch (err) {
      console.error("Failed to execute undo action:", err);
      // Put it back
      this.undoStack.push(action);
      this.notify();
      throw err;
    }
  }

  public async redo(): Promise<HistoryAction | null> {
    const action = this.redoStack.pop();
    if (!action) return null;

    try {
      await action.redo();
      this.undoStack.push(action);
      if (this.undoStack.length > this.maxStack) {
        this.undoStack.shift();
      }
      this.notify();
      return action;
    } catch (err) {
      console.error("Failed to execute redo action:", err);
      // Put it back
      this.redoStack.push(action);
      this.notify();
      throw err;
    }
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

export const globalHistoryManager = new HistoryManager(MAX_HISTORY_STACK);
