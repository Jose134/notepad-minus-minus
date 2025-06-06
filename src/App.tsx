import { Editor } from '@monaco-editor/react'
import './App.css'
import { Tab, TabBar } from './components/TabBar'
import WelcomeScreen from './components/WelcomeScreen'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

// const { showOpenDialog, showSaveDialog } = window.electron || {};
const { onOpenFile, clearOpenFileCallbacks } = window.electron || {};

type AppState = {
  tabs: Tab[];
  activeTabId: string | null;
}

function App() {
  const [appState, setAppState] = useState<AppState>({ tabs: [], activeTabId: null });
  
  useEffect(() => {
    onOpenFile((filePath, content) => {
      const newTabId = uuidv4();
      setAppState({
        ...appState,
        tabs: [...appState.tabs, { id: newTabId, name: filePath, content, dirty: false }],
        activeTabId: newTabId
      });
    });

    return () => {
      clearOpenFileCallbacks();
    }

  }, [appState])

  const onTabSelect = (tabId: string) => {
    setAppState({ ...appState, activeTabId: tabId });
  }

  const onTabClose = (tabId: string) => {
    const newTabs = appState.tabs.filter(tab => tab.id !== tabId);
    const leftTabIndex = appState.tabs.findIndex(tab => tab.id === tabId) - 1;
    const newActiveTabId = appState.activeTabId === tabId
      ? appState.tabs[leftTabIndex]?.id || newTabs[0]?.id || null
      : appState.activeTabId;
    setAppState({ ...appState, tabs: newTabs, activeTabId: newActiveTabId });
  };

  const onNewTab = () => {
    const newTabId = uuidv4();
    setAppState({
      ...appState,
      tabs: [...appState.tabs, { id: newTabId, name: `New File` }],
      activeTabId: newTabId
    });
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

  // // Block Ctrl+W and close only the active tab
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
  //       e.preventDefault();
  //       if (appState.activeTabId) {
  //         onTabClose(appState.activeTabId);
  //       }
  //     }
  //     else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
  //       e.preventDefault();
  //       onNewTab();
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [appState.activeTabId, appState.tabs]);

  return (
    <>
      <TabBar
        tabs={appState.tabs}
        activeTabId={appState.activeTabId}
        onTabSelect={onTabSelect}
        onNewTab={onNewTab}
        onTabClose={onTabClose}
      />
      <div className="editor-container">
        {
          appState.tabs.length === 0
            ? <WelcomeScreen onCreateNew={onNewTab} />
            : <Editor
                theme="vs-dark"
                onChange={onChange}
                language="plaintext"
                options={{
                  minimap: { enabled: false },
                  fontSize: 16,
                  lineNumbers: 'off',
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
