import Tab from '../models/Tab';
import './TabBar.css'
import { IoAdd, IoClose, IoAlert } from 'react-icons/io5';

type TabBarProps = {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onNewTab: () => void;
  onTabClose: (tabId: string) => void;
}

const TabBar = ({ tabs, activeTabId, onTabSelect, onNewTab, onTabClose }: TabBarProps) => {
  return (
    <div className="tabs-container">
      {tabs.map((tab, index) => {
        return (
          <div
            key={index}
            className={`tab ${activeTabId === tab.id ? 'tab-active' : ''}`}
            onClick={() => { onTabSelect(tab.id) }}>

            <span>{tab.name}</span>
            <button
              className="tab-close-btn"
              onClick={e => {
                e.stopPropagation(); // Prevent tab selection when closing
                onTabClose(tab.id);
              }}
            >
              {
                tab.dirty ? <IoAlert/> : <IoClose/>
              }
            </button>
          
          </div>
        )
      })}
      <div>
        <button className="new-tab-btn" onClick={onNewTab}><IoAdd/></button>
      </div>
    </div>
  );
}

export default TabBar;