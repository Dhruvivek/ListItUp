const MAILPIT_POLL_ATTEMPTS = 30;
const MAILPIT_POLL_INTERVAL_MS = 250;

type MailpitMessage = {
  ID?: string;
  id?: string;
  Subject?: string;
  To?: Array<{ Address?: string }>;
};

function mailpitApiUrl(): string {
  const mailpitUrl = process.env.MAILPIT_API_URL;
  if (!mailpitUrl) throw new Error("MAILPIT_API_URL must be set for browser tests.");

  return mailpitUrl;
}

export async function mailpitMessagesFor(email: string): Promise<MailpitMessage[]> {
  const response = await fetch(`${mailpitApiUrl()}/api/v1/messages`);
  const body = (await response.json()) as { messages?: MailpitMessage[] };

  return body.messages?.filter((message) =>
    message.To?.some((recipient) => recipient.Address === email)
  ) ?? [];
}

export function mailpitMessageIds(messages: MailpitMessage[]): Set<string> {
  return new Set(
    messages
      .map((message) => message.ID ?? message.id)
      .filter((id): id is string => Boolean(id))
  );
}

export async function waitForMailpitLink(
  email: string,
  knownMessageIds = new Set<string>()
): Promise<string> {
  const mailpitUrl = mailpitApiUrl();

  for (let attempt = 0; attempt < MAILPIT_POLL_ATTEMPTS; attempt += 1) {
    const message = (await mailpitMessagesFor(email)).find((candidate) => {
      const candidateId = candidate.ID ?? candidate.id;
      return candidateId && !knownMessageIds.has(candidateId);
    });
    const id = message?.ID ?? message?.id;
    if (id) {
      const detail = await fetch(`${mailpitUrl}/api/v1/message/${id}`);
      const content = JSON.stringify(await detail.json());
      const link = content.match(/http:\/\/[^\s"\\]+/);
      if (link) return link[0].replace(/\\u0026/g, "&");
    }
    await new Promise((resolve) => setTimeout(resolve, MAILPIT_POLL_INTERVAL_MS));
  }
  throw new Error(`Mailpit did not receive an authentication link for ${email}.`);
}
