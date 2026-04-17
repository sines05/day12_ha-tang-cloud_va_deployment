import type React from 'react';

export interface HolidayTheme {
  name: string;
  logo: string; // path to logo image
  decorations?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>; // e.g., Snow, Fireworks
    props?: Record<string, unknown>;
    target: 'header' | 'layout';
  }[];
}

interface Holiday {
  name: string;
  start: (year: number) => Date;
  end: (year: number) => Date;
  theme: () => Promise<{ default: HolidayTheme }>; // Dynamic import for the theme
}

export const holidays: Holiday[] = [
  {
    name: 'Christmas',
    start: (year) => new Date(year, 10, 28), // Nov 28
    end: (year) => new Date(year, 11, 27), // Dec 27
    theme: () => import('./themes/christmas-theme'), // Dynamically import Christmas theme
  },
  {
    name: 'New Year',
    start: (year) => new Date(year, 11, 28), // Dec 28
    end: (year) => new Date(year + 1, 1, 25), // Feb 25 of next year
    theme: () => import('./themes/new-year-theme'), // Dynamically import New Year theme
  },
];

/**
 * Gets the active holiday theme for the current date.
 * It checks for holiday periods starting in the previous year and the current year
 * to correctly handle themes that span across the new year.
 * @returns {Promise<HolidayTheme | null>} A promise that resolves to the active theme or null.
 */
export const getActiveHolidayTheme = async (): Promise<HolidayTheme> => {
  const today = new Date();
  const currentYear = today.getFullYear();

  for (const holiday of holidays) {
    // Check for a holiday period that might have started in the PREVIOUS year
    const prevYearStart = holiday.start(currentYear - 1);
    const prevYearEnd = holiday.end(currentYear - 1);
    if (today >= prevYearStart && today <= prevYearEnd) {
      const themeModule = await holiday.theme();
      return themeModule.default;
    }

    // Check for a holiday period starting in the CURRENT year
    const currentYearStart = holiday.start(currentYear);
    const currentYearEnd = holiday.end(currentYear);
    if (today >= currentYearStart && today <= currentYearEnd) {
      const themeModule = await holiday.theme();
      return themeModule.default;
    }
  }

  // Default theme if no holiday is active
  const defaultThemeModule = await import('./themes/default-theme');
  return defaultThemeModule.default;
};