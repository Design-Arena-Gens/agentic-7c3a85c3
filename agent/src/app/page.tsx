/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

type SocialPlatform = "facebook" | "linkedin" | "instagram";

interface SocialSearchResult {
  id: string;
  platform: SocialPlatform;
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

interface SummaryResponse {
  summary: string;
  tokensUsed: number;
}

interface SearchResponse {
  results: SocialSearchResult[];
  summary: SummaryResponse | null;
  generatedAt: string;
  total: number;
  platforms: SocialPlatform[];
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

export default function Home() {
  const [keywords, setKeywords] = useState("job vacancy");
  const [location, setLocation] = useState("Butwal, Nepal");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    "facebook",
    "linkedin",
    "instagram",
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SocialSearchResult[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const hasResults = results.length > 0;

  const topResults = useMemo(
    () => results.slice(0, 8),
    [results],
  );

  useEffect(() => {
    void runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(auto = false) {
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform.");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords,
          location,
          platforms: selectedPlatforms,
          includeSummary,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unknown error");
      }

      const payload = (await response.json()) as SearchResponse;
      setResults(payload.results);
      setSummary(payload.summary);
      setGeneratedAt(payload.generatedAt);
    } catch (err) {
      if (!auto) {
        console.error(err);
      }
      setError(
        err instanceof Error
          ? err.message
          : "Unable to fetch job updates right now.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function togglePlatform(platform: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform],
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 lg:flex-row">
        <section className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:w-2/5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">
              Social Job Scout
            </h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
              AI Agent
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            Track job vacancies shared on Facebook, LinkedIn, and Instagram near
            Butwal, Nepal. Tune the search and let the agent surface the newest
            leads for you.
          </p>

          <form
            className="mt-6 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <div>
              <label
                htmlFor="keywords"
                className="text-sm font-medium text-zinc-700"
              >
                Keywords
              </label>
              <input
                id="keywords"
                name="keywords"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="job vacancy, sales, marketing"
                required
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="text-sm font-medium text-zinc-700"
              >
                Location focus
              </label>
              <input
                id="location"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Butwal, Nepal"
                required
              />
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-700">Platforms</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["facebook", "linkedin", "instagram"] as SocialPlatform[]).map(
                  (platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                        selectedPlatforms.includes(platform)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-75" />
                      {PLATFORM_LABELS[platform]}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  Generate AI digest
                </p>
                <p className="text-xs text-zinc-500">
                  Uses OpenAI if configured via OPENAI_API_KEY.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={includeSummary}
                  onChange={(event) => setIncludeSummary(event.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-zinc-300 transition-all peer-checked:bg-emerald-500 peer-focus:outline peer-focus:outline-2 peer-focus:outline-offset-2 peer-focus:outline-emerald-500" />
                <span className="pointer-events-none -ml-8 h-5 w-5 transform rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSearching ? (
                <>
                  <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                  Scanning social posts...
                </>
              ) : (
                "Run job search"
              )}
            </button>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </form>

          {generatedAt && (
            <p className="mt-6 text-xs text-zinc-400">
              Last refreshed: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </section>

        <section className="w-full flex-1 space-y-6">
          {summary && (
            <article className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700">
                    AI digest
                  </h2>
                  <p className="mt-1 text-xs text-emerald-700/60">
                    Tokens used: {summary.tokensUsed}
                  </p>
                </div>
                <img
                  src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f310.svg"
                  alt=""
                  className="h-8 w-8 opacity-80"
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-emerald-800">
                {summary.summary}
              </p>
            </article>
          )}

          {!hasResults && !isSearching && (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-10 text-center text-sm text-zinc-500">
              No social job leads yet. Run the scout to fetch the latest roles.
            </div>
          )}

          {isSearching && (
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-sm text-indigo-700 shadow-sm">
              <p className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500" />
                </span>
                Gathering leads from selected platforms...
              </p>
            </div>
          )}

          {hasResults && (
            <div className="space-y-4">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    {results.length} social leads
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Ranked by relevance to “{keywords}” around {location}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPlatforms.map((platform) => (
                    <PlatformBadge key={platform} platform={platform} />
                  ))}
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                {topResults.map((result) => (
                  <article
                    key={result.id}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-zinc-800 group-hover:text-emerald-700">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="focus:outline-none focus:ring-4 focus:ring-emerald-200"
                        >
                          {result.title}
                        </a>
                      </h3>
                      <PlatformBadge platform={result.platform} />
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm text-zinc-600">
                      {result.snippet || "No description preview available."}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                      <span>Relevance score {result.relevanceScore}</span>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-600 transition hover:text-emerald-500"
                      >
                        Open post
                      </a>
                    </div>
                  </article>
                ))}
              </div>

              {results.length > topResults.length && (
                <details className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
                    View additional {results.length - topResults.length} leads
                  </summary>
                  <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                    {results.slice(topResults.length).map((result) => (
                      <li key={result.id} className="flex flex-col gap-1">
                        <span className="font-medium text-zinc-800">
                          {result.title}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-zinc-400">
                          {PLATFORM_LABELS[result.platform]}
                        </span>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-500"
                        >
                          {result.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: SocialPlatform }) {
  const label = PLATFORM_LABELS[platform];
  const colors: Record<SocialPlatform, string> = {
    facebook: "bg-blue-100 text-blue-700 border-blue-200",
    linkedin: "bg-sky-100 text-sky-700 border-sky-200",
    instagram: "bg-pink-100 text-pink-700 border-pink-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${colors[platform]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
