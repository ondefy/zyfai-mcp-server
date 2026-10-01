function toStructuredContent(data: unknown): Record<string, unknown> {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  if (Array.isArray(data)) {
    return { items: data };
  }
  return { value: data };
}

export function toolJsonContent(data: unknown, summary?: string) {
  const json = JSON.stringify(data, null, 2);
  const headline =
    summary ??
    (typeof data === "object" && data !== null && "summary" in data
      ? String((data as { summary?: string }).summary)
      : undefined);
  const text = headline ? `${headline}\n\n${json}` : json;
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    structuredContent: toStructuredContent(data),
  };
}

export function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}
