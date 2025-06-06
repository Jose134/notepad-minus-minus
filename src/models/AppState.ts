import Tab from "./Tab";

type AppState = {
  tabs: Tab[];
  activeTabId: string | null;
}

export default AppState;