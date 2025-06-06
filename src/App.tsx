import { Editor } from '@monaco-editor/react'
import './App.css'
import TabBar from './components/TabBar'
import WelcomeScreen from './components/WelcomeScreen'
import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Tab from './models/Tab'

type AppState = {
  tabs: Tab[];
  activeTabId: string | null;
}

function App() {
  const [appState, setAppState] = useState<AppState>({ tabs: [], activeTabId: null });
  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState])

  useEffect(() => {
    if (!window.electron) return;
    const { onNewFile, onOpenFile, onCloseCurrentTab, onGetActiveTab, onGetAllTabs, onTabUpdated, onAllTabsUpdated, clearCallbacks } = window.electron;

    onNewFile(() => {
      createNewTab();
    });

    onOpenFile((filePath, content) => {
      const newTabId = uuidv4();
      const tabName = filePath.split(/\\|\//).pop() || 'Untitled';
      setAppState(prev => ({
        ...prev,
        tabs: [...prev.tabs, { id: newTabId, name: tabName, path: filePath, content, dirty: false }],
        activeTabId: newTabId
      }));
    });

    onCloseCurrentTab(() => {
      if (appStateRef.current.activeTabId) {
        closeTab(appStateRef.current.activeTabId);
      }
    })

    onGetActiveTab(() => {
      return appStateRef.current.tabs.find(tab => tab.id === appStateRef.current.activeTabId) ?? null;
    });

    onGetAllTabs(() => {
      return appStateRef.current.tabs;
    })

    onTabUpdated((tab) => {
      const updatedTabs = appStateRef.current.tabs.map(t =>
        t.id === tab.id ? { ...t, ...tab } : t
      );
      const newActiveTabId = updatedTabs.find(t => t.id === appStateRef.current.activeTabId)?.id || updatedTabs[0]?.id || null;
      setAppState(prev => ({ ...prev, activeTabId: newActiveTabId, tabs: updatedTabs }));
    });

    onAllTabsUpdated((tabs) => {
      setAppState(prev => {
        const newActiveTabId = tabs.find(tab => tab.id === prev.activeTabId)?.id || tabs[0]?.id || null;
        return { ...prev, activeTabId: newActiveTabId, tabs };
      });
    });

    return () => {
      clearCallbacks();
    }

  }, []);

  const selectTab = (tabId: string) => {
    setAppState({ ...appState, activeTabId: tabId });
  }

  const closeTab = (tabId: string) => {
    const newTabs = appStateRef.current.tabs.filter(tab => tab.id !== tabId);
    const leftTabIndex = appStateRef.current.tabs.findIndex(tab => tab.id === tabId) - 1;
    const newActiveTabId = appStateRef.current.activeTabId === tabId
      ? appStateRef.current.tabs[leftTabIndex]?.id || newTabs[0]?.id || null
      : appStateRef.current.activeTabId;
    setAppState(prev => ({ ...prev, tabs: newTabs, activeTabId: newActiveTabId }));
  };

  const createNewTab = () => {
    const newTabId = uuidv4();
    setAppState(prev => ({
      ...prev,
      tabs: [...prev.tabs, { id: newTabId, name: `New File` }],
      activeTabId: newTabId
    }));
  }

  const onChange = (value: string | undefined) => {
    if (!appState.activeTabId) return;
    const updatedTab = appState.tabs.find(tab => tab.id === appState.activeTabId);
    if (!updatedTab) return;

    const newTabs = appState.tabs.map(tab =>
      tab.id === updatedTab.id ? { ...tab, dirty: true, content: value || '' } : tab
    );
    setAppState({ ...appState, tabs: newTabs });
  }

  return (
    <>
      <TabBar
        tabs={appState.tabs}
        activeTabId={appState.activeTabId}
        onTabSelect={selectTab}
        onNewTab={createNewTab}
        onTabClose={closeTab}
      />
      <div className="editor-container">
        {
          appState.tabs.length === 0
            ? <WelcomeScreen onCreateNew={createNewTab} />
            : <Editor
              theme="vs-dark"
              onChange={onChange}
              language="plaintext"
              options={{
                minimap: { enabled: false },
                fontSize: 16,
              }}
              value={
                appState.tabs.find(tab => tab.id === appState.activeTabId)?.content || ''
              }
            />
        }
      </div>
    </>
  )
}

export default App
