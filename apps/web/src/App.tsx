import React, { useState, useEffect } from "react";
import { CreatePage } from "./features/creator/CreatePage";
import { LinksPage } from "./features/creator/LinksPage";
import { BuilderPage } from "./features/builder/BuilderPage";
import { PresentationPage } from "./features/presenter/PresentationPage";
import { ToastProvider } from "./components/ui/Toast";
import "./styles/tokens.css";

type PageState =
  | { name: "create" }
  | { name: "links"; triviaNightId: string; editToken: string; presentToken: string }
  | { name: "builder"; triviaNightId: string; editToken: string }
  | { name: "present"; triviaNightId: string; presentToken: string; editToken?: string | undefined };

export default function App() {
  const [page, setPage] = useState<PageState>({ name: "create" });

  // Handle URL parsing on mount to allow link resumption
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const editToken = params.get("editToken");
    const presentToken = params.get("presentToken");

    if (id) {
      if (editToken) {
        setPage({ name: "builder", triviaNightId: id, editToken });
      } else if (presentToken) {
        setPage({ name: "present", triviaNightId: id, presentToken });
      }
    }
  }, []);

  const navigateToCreate = () => {
    // Clear URL parameters for a fresh start
    window.history.pushState({}, "", "/");
    setPage({ name: "create" });
  };

  const navigateToBuilder = (triviaNightId: string, editToken: string) => {
    window.history.pushState({}, "", `/?id=${triviaNightId}&editToken=${editToken}`);
    setPage({ name: "builder", triviaNightId, editToken });
  };

  const navigateToPresent = (triviaNightId: string, presentToken: string, editToken?: string) => {
    window.history.pushState(
      {},
      "",
      `/?id=${triviaNightId}&presentToken=${presentToken}${editToken ? `&editToken=${editToken}` : ""}`
    );
    setPage({ name: "present", triviaNightId, presentToken, editToken });
  };

  const navigateToLinks = (triviaNightId: string, editToken: string, presentToken: string) => {
    setPage({ name: "links", triviaNightId, editToken, presentToken });
  };

  // Render correct page view
  const renderContent = () => {
    switch (page.name) {
      case "create":
        return <CreatePage onCreated={navigateToLinks} />;
      
      case "links":
        return (
          <LinksPage
            triviaNightId={page.triviaNightId}
            editToken={page.editToken}
            presentToken={page.presentToken}
            onGoToBuilder={() => navigateToBuilder(page.triviaNightId, page.editToken)}
          />
        );
      
      case "builder":
        return (
          <BuilderPage
            triviaNightId={page.triviaNightId}
            editToken={page.editToken}
            onExit={navigateToCreate}
            onLaunchPresenter={(presentToken) =>
              navigateToPresent(page.triviaNightId, presentToken, page.editToken)
            }
          />
        );
      
      case "present":
        return (
          <PresentationPage
            triviaNightId={page.triviaNightId}
            presentToken={page.presentToken}
            editToken={page.editToken}
            onExit={() => {
              if (page.editToken) {
                navigateToBuilder(page.triviaNightId, page.editToken);
              } else {
                navigateToCreate();
              }
            }}
          />
        );
      
      default:
        return <CreatePage onCreated={navigateToLinks} />;
    }
  };

  return (
    <ToastProvider>
      {renderContent()}
    </ToastProvider>
  );
}
