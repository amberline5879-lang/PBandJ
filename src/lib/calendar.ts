export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  isGoogleCalendar?: boolean;
}

/**
 * Fetch events from the primary Google Calendar for a date range
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin?: Date,
  timeMax?: Date
): Promise<GoogleCalendarEvent[]> {
  if (!accessToken) return [];

  try {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');

    if (timeMin) {
      url.searchParams.append('timeMin', timeMin.toISOString());
    } else {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      url.searchParams.append('timeMin', now.toISOString());
    }

    if (timeMax) {
      url.searchParams.append('timeMax', timeMax.toISOString());
    } else {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      url.searchParams.append('timeMax', future.toISOString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Calendar fetch error:', response.status, errText);
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      ...item,
      isGoogleCalendar: true,
    }));
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

/**
 * Create a new event on Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  summary: string,
  description: string,
  start: Date,
  end: Date,
  location?: string
): Promise<GoogleCalendarEvent> {
  if (!accessToken) {
    throw new Error('Access token is required to create a Google Calendar event');
  }

  const payload = {
    summary,
    description: description || 'Created with Serene Structure',
    location,
    start: {
      dateTime: start.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Create Google Calendar event failed:', errorText);
    throw new Error('Failed to create Google Calendar event');
  }

  const created = await response.json();
  return {
    ...created,
    isGoogleCalendar: true,
  };
}

/**
 * Delete a Google Calendar event with safety check
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  summary?: string
): Promise<boolean> {
  if (!accessToken) {
    throw new Error('Access token is required to delete a Google Calendar event');
  }

  const confirmMsg = summary
    ? `Are you sure you want to delete the Google Calendar event "${summary}"? This cannot be undone.`
    : `Are you sure you want to delete this Google Calendar event? This cannot be undone.`;

  const confirmed = window.confirm(confirmMsg);
  if (!confirmed) return false;

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    console.error('Delete Google Calendar event failed:', errorText);
    throw new Error('Failed to delete Google Calendar event');
  }

  return true;
}
