import React, { useEffect, useState } from 'react';
import SettingsCard from '../SettingsCard';
import Cookies from 'js-cookie';
import Select from 'react-select';

const AppearanceSettings = () => {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    setTheme(Cookies.get('theme') ?? 'system');
  }, []);

  const themeOptions = [
    { value: 'light', label: 'Light ☀' },
    { value: 'dark', label: 'Dark 🌑' },
    { value: 'system', label: 'System 💻' },
  ];

  return (
    <>
      <SettingsCard
        title="Color Scheme"
        onSave={() => {
          Cookies.set('theme', theme);
        }}
      >
        <Select
          options={themeOptions}
          onChange={(e: any) => setTheme(e.value)}
        />
      </SettingsCard>
    </>
  );
};

export default AppearanceSettings;
