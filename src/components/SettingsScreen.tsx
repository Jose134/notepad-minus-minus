import { useState } from "react";
import './SettingsScreen.css';
import Settings from "../models/Settings";

type SettingsProps = {
  currentSettings: Settings;
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

type SettingsItemProp = {
  inputKey: string;
  inputValue: string | number | boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumberSetting = ({ inputKey, inputValue, label, onChange }: SettingsItemProp) => {
  return (
    <div className="setting-item">
      <label htmlFor={inputKey}>{label}</label>
      <input
        type="number"
        id={inputKey}
        name={inputKey}
        min="6"
        max="72"
        defaultValue={inputValue as number}
        onChange={onChange} />
    </div>
  );
}

const BooleanSetting = ({ inputKey, inputValue, label, onChange }: SettingsItemProp) => {
  return (
    <div className="setting-item">
      <label htmlFor={inputKey}>{label}</label>
      <input
        type="checkbox"
        id={inputKey}
        name={inputKey}
        checked={inputValue as boolean}
        onChange={onChange} />
    </div>
  );
}

const SettingsScreen = ({ currentSettings, onClose, onSave }: SettingsProps) => {
  const [settings, setSettings] = useState(currentSettings);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    const { name, value, type, checked } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  }

  const convertKeyToLabel = (key: string): string => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  }

  return (
    <>
      <div className="settings-container">
        <h1>Settings</h1>
        <div style={{ marginBottom: '12px' }}>
          {
            Object.keys(settings).map(key => {
              const value = Object.values(settings)[Object.keys(settings).indexOf(key)];
              if (typeof value === 'boolean') {
                return <BooleanSetting key={key} inputKey={key} inputValue={value} label={convertKeyToLabel(key)} onChange={handleInputChange}></BooleanSetting>
              }
              else if (typeof value === 'number') {
                return <NumberSetting key={key} inputKey={key} inputValue={value} label={convertKeyToLabel(key)} onChange={handleInputChange}></NumberSetting>
              }
              else {
                return <div>ERROR: Unknown setting type</div>
              }
            })
          }
        </div>
        <div className="option-buttons-container">
          <button className="btn-fixed" onClick={() => setSettings(currentSettings)}>Reset</button>
          <button className="btn-fixed" onClick={onClose}>Cancel</button>
          <button className="btn-fixed btn-accent" onClick={() => onSave(settings)}>Save</button>
        </div>
      </div>
    </>
  );
}

export default SettingsScreen;