import Tab from '../models/Tab';
import './TabBar.css'
import { IoAdd, IoClose } from 'react-icons/io5';
import { useState } from 'react';
import { FaCircle } from 'react-icons/fa';

type TabBarProps = {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onNewTab: () => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (newTabs: Tab[]) => void;
}

const TabBar = ({ tabs, activeTabId, onTabSelect, onNewTab, onTabClose, onTabReorder }: TabBarProps) => {
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedTabIndex(index);
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = () => {
    if (
      draggedTabIndex !== null &&
      dragOverIndex !== null &&
      draggedTabIndex !== dragOverIndex
    ) {
      const newTabs = [...tabs];
      const [removed] = newTabs.splice(draggedTabIndex, 1);
      newTabs.splice(dragOverIndex, 0, removed);
      onTabReorder(newTabs);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="tabs-container">
      {tabs.map((tab, index) => {
        const isDragOver = dragOverIndex === index && draggedTabIndex !== null && draggedTabIndex !== index;
        const isHovered = hoveredTabIndex === index;
        return (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'tab-active' : ''} ${isDragOver ? 'tab-drag-over' : ''}`}
            onClick={() => { onTabSelect(tab.id) }}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={e => handleDragOver(index, e)}
            onDrop={handleDrop}
            onDragEnd={() => { setDraggedTabIndex(null); setDragOverIndex(null); }}
          >
            <span>{tab.name}</span>
            <button
              className={`tab-close-btn ${tab.dirty ? 'dirty' : ''}`}
              onMouseEnter={() => setHoveredTabIndex(index)}
              onMouseLeave={() => setHoveredTabIndex(null)}
              onClick={e => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              {tab.dirty && !isHovered ? <FaCircle fontSize={"0.3em"}/> : <IoClose/>}
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