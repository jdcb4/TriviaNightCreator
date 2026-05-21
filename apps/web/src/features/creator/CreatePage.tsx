import React, { useState } from "react";
import { Heading, Body, Surface, Stack, Input, Button } from "../../components/ui/primitives";

interface CreatePageProps {
  onCreated: (triviaNightId: string, editToken: string, presentToken: string) => void;
}

export const CreatePage: React.FC<CreatePageProps> = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trivia-nights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          date: date || undefined,
          venue: venue || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create trivia night");
      }

      const data = await response.json();
      onCreated(data.triviaNight.id, data.editToken, data.presentToken);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-gradient">
      {/* Background ambient glowing elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-info/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <Stack gap="large" align="center" className="w-full max-w-lg z-10">
        <div className="text-center">
          <Heading level={1} display={true} className="mb-2">
            Trivia Night Creator
          </Heading>
          <Body className="text-text-secondary text-lg">
            Plan and host premium in-person trivia events without accounts or friction.
          </Body>
        </div>

        <Surface variant="raised" glass={true} className="w-full p-8 glass-panel">
          <form onSubmit={handleSubmit}>
            <Stack gap="default">
              <Heading level={2} className="mb-2 text-center text-accent-primary font-display font-semibold">
                Setup Event Details
              </Heading>

              <Input
                label="Event Title *"
                placeholder="e.g. Annual Charity Trivia, Friday Fun"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Subtitle (Optional)"
                placeholder="e.g. Benefiting the Local Library"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={loading}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date (Optional)"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                />
                <Input
                  label="Venue (Optional)"
                  placeholder="e.g. Main Hall, Zoom Room"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-accent-danger/10 border border-accent-danger/20 rounded-xl text-accent-danger text-body-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-4 py-3"
                disabled={loading || !title.trim()}
              >
                {loading ? "Creating Event..." : "Create Trivia Night"}
              </Button>
            </Stack>
          </form>
        </Surface>

        <div className="text-center text-text-subtle text-caption">
          All data is private and stored securely.
        </div>
      </Stack>
    </div>
  );
};
