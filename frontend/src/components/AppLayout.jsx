import Sidebar from "./Sidebar";

const AppLayout = ({ children }) => {
  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;