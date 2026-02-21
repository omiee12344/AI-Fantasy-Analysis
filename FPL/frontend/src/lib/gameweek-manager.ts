/**
 * Fixtures-first Gameweek Management System
 * 
 * Implements logic where GW progresses only when all fixtures are complete,
 * not just based on deadline times.
 */

export interface FPLEvent {
  id: number;
  name: string;
  deadline_time: string;
  deadline_time_epoch: number;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
}

export interface FPLFixture {
  id: number;
  code: number;
  event: number;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean;
  team_a: number;
  team_h: number;
  stats: any[];
  team_a_score: number | null;
  team_h_score: number | null;
  pulse_id: number;
  status: string; // 'FT', 'AET', 'PEN', 'AWARDED', 'POSTPONED', etc.
}

export interface GameweekStatus {
  gwId: number;
  isComplete: boolean;
  completedCount: number;
  totalCount: number;
  fixtures: FPLFixture[];
  dateRange: {
    start: Date;
    end: Date;
    startLocal: string;
    endLocal: string;
  } | null;
}

/**
 * Determines if a fixture is complete based on status
 */
export function isFixtureComplete(fixture: FPLFixture, eventFinished: boolean = false): boolean {
  // Primary check: fixture finished flag
  if (fixture.finished === true) return true;
  
  // Secondary check: specific status codes that indicate completion
  const completeStatuses = ['FT', 'AET', 'PEN', 'AWARDED'];
  if (completeStatuses.includes(fixture.status)) return true;
  
  // Special case: POSTPONED is only complete if event is officially finished
  if (fixture.status === 'POSTPONED' && eventFinished) return true;
  
  return false;
}

/**
 * Gets all fixtures for a specific gameweek
 */
export function getGwFixtures(fixtures: FPLFixture[], gwId: number): FPLFixture[] {
  return fixtures.filter(f => f.event === gwId);
}

/**
 * Analyzes gameweek completion status
 */
export function analyzeGameweekCompletion(
  fixtures: FPLFixture[], 
  gwId: number, 
  eventFinished: boolean = false
): GameweekStatus {
  const gwFixtures = getGwFixtures(fixtures, gwId);
  
  // Handle edge case: no fixtures for this gameweek
  if (gwFixtures.length === 0) {
    return {
      gwId,
      isComplete: eventFinished, // Fallback to event.finished flag
      completedCount: 0,
      totalCount: 0,
      fixtures: [],
      dateRange: null
    };
  }
  
  // Count completed fixtures
  const completedFixtures = gwFixtures.filter(f => isFixtureComplete(f, eventFinished));
  const completedCount = completedFixtures.length;
  const totalCount = gwFixtures.length;
  
  // GW is complete when ALL fixtures are complete OR event is officially finished
  const isComplete = (completedCount === totalCount) || eventFinished;
  
  // Calculate date range from fixture kickoff times
  let dateRange = null;
  if (gwFixtures.length > 0) {
    const kickoffTimes = gwFixtures
      .map(f => new Date(f.kickoff_time))
      .filter(date => !isNaN(date.getTime()));
    
    if (kickoffTimes.length > 0) {
      const start = new Date(Math.min(...kickoffTimes.map(d => d.getTime())));
      const end = new Date(Math.max(...kickoffTimes.map(d => d.getTime())));
      
      dateRange = {
        start,
        end,
        startLocal: start.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        endLocal: end.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      };
    }
  }
  
  return {
    gwId,
    isComplete,
    completedCount,
    totalCount,
    fixtures: gwFixtures,
    dateRange
  };
}

/**
 * Resolves current gameweek using fixtures-first logic
 */
export function resolveCurrentGW(
  events: FPLEvent[], 
  fixtures: FPLFixture[], 
  nowUTC: Date = new Date()
): number {
  if (!events.length) return 1;
  
  // Sort events by ID to ensure proper order
  const sortedEvents = [...events].sort((a, b) => a.id - b.id);
  
  // Find the first gameweek that is not complete
  for (const event of sortedEvents) {
    const gwStatus = analyzeGameweekCompletion(fixtures, event.id, event.finished);
    
    if (!gwStatus.isComplete) {
      return event.id;
    }
  }
  
  // If all gameweeks are complete, return the last one
  return sortedEvents[sortedEvents.length - 1].id;
}

/**
 * Gets formatted date range for display
 */
export function getGameweekDateRange(gwStatus: GameweekStatus): string {
  if (!gwStatus.dateRange) return 'TBD';
  
  const { startLocal, endLocal } = gwStatus.dateRange;
  return startLocal === endLocal ? startLocal : `${startLocal} - ${endLocal}`;
}

/**
 * Gets match progress string for display
 */
export function getMatchProgress(gwStatus: GameweekStatus): string {
  if (gwStatus.totalCount === 0) return 'No fixtures';
  return `${gwStatus.completedCount}/${gwStatus.totalCount} played`;
}

/**
 * Formats deadline time to local timezone
 */
export function formatDeadlineLocal(deadlineUTC: string): string {
  try {
    const deadline = new Date(deadlineUTC);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Passed';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMins}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Creates a gameweek refresh manager with timers and focus events
 */
export class GameweekRefreshManager {
  private intervalId: NodeJS.Timeout | null = null;
  private focusListener: (() => void) | null = null;
  private refreshCallback: (() => void) | null = null;
  
  constructor(refreshCallback: () => void) {
    this.refreshCallback = refreshCallback;
  }
  
  start() {
    // Hourly refresh timer
    this.intervalId = setInterval(() => {
      if (this.refreshCallback) {
        console.log('🕐 Hourly gameweek refresh triggered');
        this.refreshCallback();
      }
    }, 60 * 60 * 1000); // 1 hour
    
    // Refresh on window focus
    this.focusListener = () => {
      if (this.refreshCallback) {
        console.log('👁️ Focus gameweek refresh triggered');
        this.refreshCallback();
      }
    };
    
    window.addEventListener('focus', this.focusListener);
    
    console.log('🔄 Gameweek refresh manager started');
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.focusListener) {
      window.removeEventListener('focus', this.focusListener);
      this.focusListener = null;
    }
    
    console.log('⏹️ Gameweek refresh manager stopped');
  }
}