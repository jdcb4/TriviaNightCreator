import React, { useState } from "react";
import { Heading, Body, Surface, Stack, Button, Subtle } from "../../components/ui/primitives";

interface LinksPageProps {
  triviaNightId: string;
  editToken: string;
  presentToken: string;
  onGoToBuilder: () => void;
}

export const LinksPage: React.FC<LinksPageProps> = ({
  triviaNightId,
  editToken,
  presentToken,
  onGoToBuilder,
}) => {
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [copiedPresent, setCopiedPresent] = useState(false);

  const baseUrl = window.location.origin;
  const editLink = `${baseUrl}/?id=${triviaNightId}&editToken=${editToken}`;
  const presentLink = `${baseUrl}/?id=${triviaNightId}&presentToken=${presentToken}`;

  const copyToClipboard = async (text: string, type: "edit" | "present") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "edit") {
        setCopiedEdit(true);
        setTimeout(() => setCopiedEdit(false), 2000);
      } else {
        setCopiedPresent(true);
        setTimeout(() => setCopiedPresent(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-gradient">
      {/* Background ambient glowing elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-info/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <Stack gap="large" align="center" className="w-full max-w-2xl z-10">
        <div className="text-center">
          <Heading level={1} display={true} className="mb-2 text-accent-primary">
            Event Created Successfully!
          </Heading>
          <Body className="text-text-secondary text-lg max-w-lg mx-auto">
            Your private trivia night is ready. Copy these links now to access or present your event. No account is needed!
          </Body>
        </div>

        <Surface variant="raised" glass={true} className="w-full p-8 glass-panel">
          <Stack gap="large">
            {/* Private Edit Link */}
            <div className="relative p-5 bg-surface-sunken border border-border-default/40 rounded-2xl flex flex-col gap-3">
              <div className="absolute top-4 right-4 bg-accent-danger/10 text-accent-danger text-caption px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Private Host Key
              </div>
              <Heading level={3} className="text-accent-primary">
                1. Host Edit & scoring Link
              </Heading>
              <Body className="text-body-sm text-text-secondary pr-20">
                Keep this link private! Use it to configure questions, print sheets, and enter team scores. Bookmark it to return later.
              </Body>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={editLink}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-default/60 text-text-secondary text-body-sm font-mono overflow-ellipsis focus:outline-none"
                />
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => copyToClipboard(editLink, "edit")}
                  className="shrink-0"
                >
                  {copiedEdit ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Public Present Link */}
            <div className="relative p-5 bg-surface-sunken border border-border-default/40 rounded-2xl flex flex-col gap-3">
              <div className="absolute top-4 right-4 bg-accent-info/10 text-accent-info text-caption px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Presentation Key
              </div>
              <Heading level={3} className="text-accent-info">
                2. Presentation & Projection Link
              </Heading>
              <Body className="text-body-sm text-text-secondary pr-20">
                Open this link on the big screen/projector in the room. This view is presentation-safe and completely hides host controls and unrevealed answers.
              </Body>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={presentLink}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-border-default/60 text-text-secondary text-body-sm font-mono overflow-ellipsis focus:outline-none"
                />
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => copyToClipboard(presentLink, "present")}
                  className="shrink-0"
                >
                  {copiedPresent ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-4 bg-accent-warning/10 border border-accent-warning/20 rounded-xl">
              <Subtle className="text-accent-warning font-medium flex gap-2">
                <span>⚠️</span>
                <span>
                  <strong>Important:</strong> Because there are no accounts, losing these links means you will lose access to your trivia night. Please bookmark or copy them now.
                </span>
              </Subtle>
            </div>

            <Button variant="primary" size="large" onClick={onGoToBuilder} className="w-full py-4 text-lg">
              Enter Host Dashboard
            </Button>
          </Stack>
        </Surface>
      </Stack>
    </div>
  );
};
