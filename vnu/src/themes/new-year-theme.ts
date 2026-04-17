import type { HolidayTheme } from '../holiday-config';
import NewYearHeaderDecoration from '../components/NewYear/NewYearHeaderDecoration';
import Snow from '../components/Christmas/Snow';
import newYearLogo from '../assets/images/head_logo_new_year.png';

// --- ADMIN CONFIGURATION ---
// Set this to true to enable the snow effect, false to disable it.
const SHOW_SNOW_EFFECT = false;
// -------------------------

const decorations: HolidayTheme['decorations'] = [
  { component: NewYearHeaderDecoration, target: 'header' },
];

if (SHOW_SNOW_EFFECT) {
  decorations.push({ component: Snow, target: 'layout' });
}

const newYearTheme: HolidayTheme = {
  name: 'New Year',
  logo: newYearLogo,
  decorations,
};

export default newYearTheme;

