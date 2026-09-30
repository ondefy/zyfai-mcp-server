export function toolJsonContent(data: unknown, summary?: string) {
  const text =
    summary ??
    (typeof data === "object" && data !== null && "summary" in data
      ? String((data as { summary?: string }).summary)
      : undefined) ??
    "OK";
  return {
    content: [
      {
        type: "text" as const,
        text: summary ?? JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data as Record<string, unknown>,
  };
}

export function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}
