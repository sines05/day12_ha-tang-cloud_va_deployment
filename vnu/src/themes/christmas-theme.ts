import type { HolidayTheme } from '../holiday-config';
import Snow from '../components/Christmas/Snow';
import ChristmasHeaderDecoration from '../components/Christmas/ChristmasHeaderDecoration';
import christmasLogo from '../assets/images/head_logo_chrismas_v2.png';

const christmasTheme: HolidayTheme = {
  name: 'Christmas',
  logo: christmasLogo,
  decorations: [
    { component: Snow, target: 'layout' },
    { component: ChristmasHeaderDecoration, target: 'header' },
  ],
};

export default christmasTheme;
